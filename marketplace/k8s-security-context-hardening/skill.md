# Pod securityContext Hardening for Pod Security Admission restricted

**One-line description:** Brings the Deployment to the Pod Security Standards `restricted` profile (numeric non-root user, no privilege escalation, all capabilities dropped, RuntimeDefault seccomp) plus a read-only root filesystem with `emptyDir` mounts for every measured writable path, and labels the namespace so admission enforces it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `resourced_deployment` (string, required): Deployment path from `k8s-requests-limits-from-usage`.
- `py_runtime_settings` (object, optional): From `k8s-py-gunicorn-worker-sizing`; supplies env and writable paths.
- `node_runtime_settings` (object, optional): From `k8s-node-heap-sizing`.
- `go_runtime_settings` (object, optional): From `k8s-go-gomaxprocs-gomemlimit`.
- `jvm_runtime_settings` (object, optional): From `k8s-jvm-container-heap`.
- `namespace` (string, required): Target namespace.
- `image_ref` (string, required): Image, used to read the numeric user id.

---

## Outputs

- `hardened_deployment` (string): Deployment path with pod and container `securityContext`, runtime env merged, and `emptyDir` volumes.
- `namespace_manifest` (string): Path to `namespace.yaml` with Pod Security Admission labels.

---

## Phase 1: Find the Numeric User and Writable Paths

### Entry Criteria
- `resourced_deployment` passes a server dry run.

### Actions
1. Read the image user: `docker image inspect "$IMAGE" --format '{{.Config.User}}'`.

| Value | Action |
|---|---|
| Empty or `root` or `0` | Image runs as root. Return to the image owner to add a user (`USER 10001` in the Dockerfile); record `open_question`. Kubernetes `runAsUser` can override, but files owned by root in the image may then be unreadable or unwritable |
| Numeric (`10001`, `65532`) | Use it as `runAsUser` |
| `name` or `name:group` | Find the uid: `docker run --rm --entrypoint id "$IMAGE" -u <name>`; if the image has no `id` binary (distroless), `docker create --name tmp "$IMAGE" && docker cp tmp:/etc/passwd ./passwd && docker rm tmp` and read the third field of the user's line |

   `runAsNonRoot: true` with a non-numeric image user fails with `container has runAsNonRoot and image has non-numeric user (...), cannot verify user is non-root`. Always set a numeric `runAsUser`.
2. Merge env from the one present `*_runtime_settings` input into the container `env` (do not duplicate names already present).
3. Build the writable path list: `workload_profile.writable_paths` (if known) plus `writable_paths` from the runtime settings. Every path gets an `emptyDir`.
4. Check whether the app needs the Kubernetes API: `grep -rnE "kubernetes|client-go|@kubernetes/client-node|io.fabric8|KUBERNETES_SERVICE_HOST" "$REPO"`. No hits means set `automountServiceAccountToken: false`.

### Output
Numeric uid, merged env, writable paths, token decision.

### Quality Gate
- `runAsUser` value is numeric and above 0, with its source command recorded.
- Every writable path has a planned volume name.

---

## Phase 2: Write the securityContext

### Entry Criteria
- Phase 1 complete.

### Actions
1. Pod level (`spec.template.spec.securityContext`):
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: <uid>
  runAsGroup: <gid>
  fsGroup: <gid>            # only when a mounted volume must be group-writable
  seccompProfile:
    type: RuntimeDefault
```
2. Container level:
```yaml
securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  privileged: false
  capabilities:
    drop: ["ALL"]
```
   The `restricted` standard allows adding back only `NET_BIND_SERVICE`. Do not add it; the app listens on a port of 1024 or above and the Service maps port 80.
3. Volumes for each writable path:
```yaml
volumes:
  - name: tmp
    emptyDir: {}
volumeMounts:
  - name: tmp
    mountPath: /tmp
```
   Use `emptyDir: { medium: Memory }` only if the path holds small, hot files (it counts against the container memory limit). Set `sizeLimit` when a path can grow (heap dumps, upload buffers); the size is the owner's choice, recorded.
4. `spec.template.spec.automountServiceAccountToken: false` when Phase 1 found no API use.
5. Do NOT set `privileged`, `hostNetwork`, `hostPID`, `hostIPC`, or `hostPath` volumes; each violates `restricted`.

### Output
Updated Deployment.

### Quality Gate
- `yq '.spec.template.spec.containers[0].securityContext.capabilities.drop[0]' deployment.yaml` prints `ALL`.
- `yq '.spec.template.spec.securityContext.seccompProfile.type' deployment.yaml` prints `RuntimeDefault`.

---

## Phase 3: Label the Namespace and Prove Admission and Runtime

### Entry Criteria
- Hardened Deployment written.

### Actions
1. Write `namespace.yaml`:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: <namespace>
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: <cluster minor, for example v1.31>
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/audit: restricted
```
   Pin `enforce-version` to the cluster's minor version (`kubectl version` server line) so a control plane upgrade does not change the rules without review.
2. If the namespace already exists and holds other workloads, preview the impact first: `kubectl label --dry-run=server --overwrite ns <namespace> pod-security.kubernetes.io/enforce=restricted`. The output lists existing pods that would violate. If any are not this app, **Stop** and report; do not break other workloads.
3. `kubectl apply --dry-run=server -f deployment.yaml`. With the namespace labeled, any remaining violation prints `Warning: would violate PodSecurity "restricted:..."`. The output must contain no such warning.
4. Roll out to a test namespace with the same labels. Then check runtime write failures: `kubectl logs -n NS POD | grep -iE "read-only file system|EROFS|permission denied"` must print nothing. A hit names the path; add an `emptyDir` for it and repeat.
5. Confirm the user: `kubectl exec -n NS POD -- id` (or read `kubectl get pod POD -o jsonpath='{.spec.securityContext.runAsUser}'` for distroless images without `id`).

### Output
`hardened_deployment`, `namespace_manifest`.

### Quality Gate
- Server dry run output contains no `would violate PodSecurity` line.
- The log grep for read-only and permission errors prints nothing after a load test.

---

## Worked Example

Illustrative only. `orders` image user `app`, Python runtime settings with writable `/tmp`.

Phase 1:
```
$ docker run --rm --entrypoint id ghcr.io/acme/orders:1.4.2 -u app
10001
```
uid 10001; env `WEB_CONCURRENCY=3`, `PYTHONUNBUFFERED=1`, `PYTHONDONTWRITEBYTECODE=1` merged; no Kubernetes client found, token automount disabled.

Phase 3:
```
$ kubectl label --dry-run=server --overwrite ns shop pod-security.kubernetes.io/enforce=restricted
Warning: existing pods in namespace "shop" violate the new PodSecurity enforce level "restricted:latest"
Warning: legacy-cron-28811520-abcde: allowPrivilegeEscalation != false, unrestricted capabilities, runAsNonRoot != true, seccompProfile
namespace/shop labeled (server dry run)
```
Another workload (`legacy-cron`) violates, so the enforce label is held and reported; `warn` and `audit` labels are applied, and the `orders` Deployment dry run shows no warning.

---

## Exit Criteria

DONE when the Deployment meets `restricted` with a read-only root filesystem, the dry run shows no PodSecurity warning, the app runs without write errors, and the namespace manifest carries the labels (or the enforce label is held with a reported reason).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Image runs as root | **Return**: to the image owner; record the open question. |
| Phase 3 | Other pods in the namespace would violate | **Stop**: apply `warn` and `audit` only and report the list. |
| Phase 3 | App fails with `Read-only file system` | **Adjust**: add an `emptyDir` for the reported path; do not turn `readOnlyRootFilesystem` off. |
| Phase 3 | `permission denied` on a mounted volume | **Adjust**: set `fsGroup` to the app gid; for large volumes add `fsGroupChangePolicy: OnRootMismatch`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
