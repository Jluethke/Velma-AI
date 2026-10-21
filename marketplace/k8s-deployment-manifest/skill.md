# Kubernetes Deployment Manifest

**One-line description:** Writes a minimal, correct `apps/v1` Deployment for one container (recommended labels, immutable selector, digest-pinned image, named port, explicit imagePullPolicy) and proves it with a server-side dry run before any other flow adds probes, resources or security settings.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workload_profile` (object, required): Output of `k8s-workload-inventory`.
- `manifest_layout` (object, required): Output of `k8s-helm-vs-kustomize-decision`; `root` is where plain manifests are staged.
- `image_ref` (string, required): Image reference; the digest from `workload_profile.image_digest` is appended.
- `namespace` (string, required): Target namespace (DNS-1123 label).

---

## Outputs

- `deployment_manifest` (string): Path to `<manifest_layout.root>/deployment.yaml`, a Deployment that passes `kubectl apply --dry-run=server`.

---

## Phase 1: Choose Labels and the Selector

### Entry Criteria
- `workload_profile.workload_kind` == `Deployment`.
- `namespace` exists: `kubectl get namespace "$NS"` prints a row. If not, it will be created by `k8s-security-context-hardening`; use `--dry-run=client` in Phase 3 until then.

### Actions
1. Use the Kubernetes recommended labels on the Deployment metadata and the pod template:
   - `app.kubernetes.io/name: <app_name>`
   - `app.kubernetes.io/instance: <app_name>` (Helm later replaces this with the release name)
   - `app.kubernetes.io/version: <image tag>`
   - `app.kubernetes.io/component: <role, for example api>`
   - `app.kubernetes.io/part-of: <system name, if known>`
2. Set `spec.selector.matchLabels` to ONLY `app.kubernetes.io/name` and `app.kubernetes.io/instance`.
3. Do NOT put `app.kubernetes.io/version` or any changing value in the selector. `spec.selector` is immutable after creation; changing it later fails with `field is immutable` and forces delete and recreate.
4. Confirm every selector label also appears in `spec.template.metadata.labels`. A mismatch fails with `selector does not match template labels`.

### Output
Label set and selector written down.

### Quality Gate
- The selector has exactly the two stable labels.
- Every selector key and value appears verbatim in the template labels.

---

## Phase 2: Write the Deployment

### Entry Criteria
- Labels chosen.

### Actions
1. Create `<manifest_layout.root>/deployment.yaml` with ONE object. Write only these fields now; later flows add the rest:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <app_name>
  namespace: <namespace>
  labels: { ...recommended labels... }
spec:
  replicas: 2
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app.kubernetes.io/name: <app_name>
      app.kubernetes.io/instance: <app_name>
  template:
    metadata:
      labels: { ...recommended labels... }
    spec:
      containers:
        - name: <app_name>
          image: <repository>@<image_digest>
          imagePullPolicy: IfNotPresent
          ports:
            - name: <port_name>
              containerPort: <container_port>
              protocol: TCP
```
2. `replicas: 2` is a placeholder; `k8s-rolling-update-pdb` sets the real value from the `replica_count` input. `revisionHistoryLimit: 10` is the Kubernetes default written explicitly so `kubectl rollout undo` targets are visible in review.
3. Image rule: pin by digest (`repo@sha256:...`). If the team requires a tag for readability, use `repo:tag@sha256:...`; the kubelet pulls by digest and ignores the tag. Never use `:latest` or an omitted tag: the default `imagePullPolicy` becomes `Always` and two pods of one ReplicaSet can run different code.
4. Image pull secret: if the registry is private, run `kubectl get secret -n "$NS"` and add `imagePullSecrets: [{name: <secret>}]` under `spec.template.spec`. Do not create the pull secret in this flow.
5. If `workload_profile.entrypoint_form` is `shell-wrapped` or `package-manager`, do NOT override `command:` here. Record it; the stack health endpoint flow fixes signal handling in the image or with `command`.

### Output
`deployment.yaml` written.

### Quality Gate
- `grep -c '^kind:' deployment.yaml` prints `1`.
- `grep -E 'image: .*@sha256:[0-9a-f]{64}' deployment.yaml` prints the image line.
- `grep -E ':latest' deployment.yaml` prints nothing.

---

## Phase 3: Prove It with a Dry Run

### Entry Criteria
- `deployment.yaml` exists.

### Actions
1. Run `kubectl apply --dry-run=server -f deployment.yaml`. Server dry run runs admission (schema, defaults, Pod Security Admission warnings, webhooks) without persisting.
2. Read the output with this table:

| Output | Meaning | Action |
|---|---|---|
| `deployment.apps/<name> created (server dry run)` or `configured (server dry run)` | Valid | Continue |
| `Warning: would violate PodSecurity "restricted:..."` | PSA warn mode; not yet blocking | Record; `k8s-security-context-hardening` fixes it |
| `error: ... unknown field "..."` | Typo or wrong indentation | Fix the field named, rerun |
| `namespaces "<ns>" not found` | Namespace missing | Use `--dry-run=client` until the namespace exists, and record it |
| `field is immutable` | An object with this name already exists with a different selector | Stop and report; do not delete a live Deployment |

3. Run `kubectl diff -f deployment.yaml` when the object already exists, and save the diff to the run notes. Exit code 1 from `kubectl diff` means differences exist, not failure; exit code above 1 is an error.

### Output
`deployment_manifest` path plus the dry-run line.

### Quality Gate
- The dry-run command output contains `(server dry run)` or, when the namespace does not exist yet, `(dry run)` from client mode with the reason recorded.

---

## Worked Example

Illustrative only. Input: `orders`, namespace `shop`, digest `sha256:3f9c...e1`, port 8000.

Phase 1 selector:
```yaml
selector:
  matchLabels:
    app.kubernetes.io/name: orders
    app.kubernetes.io/instance: orders
```
Phase 2 image line: `image: ghcr.io/acme/orders:1.4.2@sha256:3f9c...e1`.

Phase 3:
```
$ kubectl apply --dry-run=server -f deploy/raw/orders/deployment.yaml
Warning: would violate PodSecurity "restricted:latest": allowPrivilegeEscalation != false (container "orders" must set securityContext.allowPrivilegeEscalation=false), ...
deployment.apps/orders created (server dry run)
```
Valid; the PSA warning is recorded for the hardening flow.

---

## Exit Criteria

DONE when `deployment.yaml` holds one Deployment with a two-label selector and a digest-pinned image, and the dry run succeeded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Existing live Deployment uses a different selector | **Stop**: reuse the live selector (`kubectl get deploy <name> -o jsonpath='{.spec.selector}'`); changing it needs a planned recreate. |
| Phase 2 | No digest available | **Return**: to `k8s-workload-inventory` Phase 2; never ship a mutable tag alone. |
| Phase 3 | Dry run rejected by an admission webhook | **Adjust**: read the webhook message, fix the named field, rerun; do not disable the webhook. |
| Phase 3 | `unknown field` error | **Retry**: fix only the named field and rerun the dry run. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
