# Apply and Watch a Deployment Rollout

**One-line description:** Applies the validated render with `kubectl diff` then server-side apply (or confirms the GitOps sync), records a change cause, watches `kubectl rollout status` with a timeout tied to `progressDeadlineSeconds`, and classifies the result from the Deployment's `Progressing` and `Available` conditions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cluster_context` (string, required): kubeconfig context.
- `namespace` (string, required): Namespace.
- `app_name` (string, required): Deployment name.
- `lint_report` (object, required): Must be `PASS`.
- `helm_rendered_manifests` (object, optional): Render to apply when `gitops_tool` is `none` and Helm was used.
- `kustomize_rendered_manifests` (object, optional): Render to apply when `gitops_tool` is `none` and Kustomize was used.
- `argocd_application` (object, optional): From `k8s-argocd-application`.
- `flux_resources` (object, optional): From `k8s-flux-kustomization`.
- `gitops_tool` (string, required): `argocd`, `flux` or `none`.
- `change_cause` (string, optional): Human text for `kubernetes.io/change-cause`, for example `orders 1.4.2: add readiness probe`.

---

## Outputs

- `rollout_result` (string): `complete`, `failed-deadline`, `failed-timeout`, or `failed-apply`.
- `deployed_revision` (object): Deployment `metadata.generation`, `deployment.kubernetes.io/revision` annotation, new ReplicaSet name, previous revision number, git revision when GitOps was used.

---

## Phase 1: Apply or Confirm Sync

### Entry Criteria
- `lint_report.overall` == `PASS`.
- `kubectl config current-context` equals `cluster_context`. If not, run every command with `--context "$CTX"`; never switch the global context silently.

### Actions
1. Record the revision before change: `kubectl -n NS get deploy APP -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}'` (empty if the Deployment is new).
2. Branch on `gitops_tool`:

| `gitops_tool` | Action |
|---|---|
| `none` | Steps 3 to 5 below |
| `argocd` | Read `argocd_application.sync_status`; it must be `Synced`. Skip to Phase 2 |
| `flux` | Read `flux_resources.ready_status`; READY must be `True` or `Unknown` (in progress). Skip to Phase 2 |

   With GitOps, do NOT run `kubectl apply` or `kubectl edit` against managed objects; self-heal reverts them and the cluster drifts from git.
3. Preview: `kubectl --context "$CTX" diff --server-side -f rendered/<env>.yaml`. Exit code 0 means no change, 1 means differences (expected), above 1 means error. Save the diff.
4. Apply: `kubectl --context "$CTX" apply --server-side --field-manager=deploy-pipeline -f rendered/<env>.yaml`. If it reports `conflict` with another field manager, read which manager owns the field (`kubectl get deploy APP -n NS --show-managed-fields -o yaml`); use `--force-conflicts` only when this pipeline is meant to own that field, and record it.
5. Record the cause: `kubectl -n NS annotate deploy APP kubernetes.io/change-cause="<change_cause>" --overwrite`. The old `--record` flag is deprecated; do not use it.

### Output
Applied (or confirmed synced) state and the pre-change revision.

### Quality Gate
- With `none`: the apply output lists `serverside-applied` lines and no `error:` line.
- With GitOps: the sync status line is copied from the tool output.

---

## Phase 2: Watch the Rollout

### Entry Criteria
- Phase 1 complete.

### Actions
1. Read the deadline: `kubectl -n NS get deploy APP -o jsonpath='{.spec.progressDeadlineSeconds}'` (default 600).
2. Watch: `kubectl --context "$CTX" -n NS rollout status deployment/APP --timeout=<deadline + pull allowance>s`. Exit code 0 prints `deployment "APP" successfully rolled out`.
3. Do not run `rollout status` without `--timeout` in automation; without it the command can wait far beyond the deadline.
4. In parallel, watch pods: `kubectl -n NS get pods -l app.kubernetes.io/name=APP -w` and note any pod with RESTARTS above 0 or a STATUS other than `Running`.

### Output
Watch output and exit code.

### Quality Gate
- The `rollout status` exit code and last line are recorded.

---

## Phase 3: Classify and Record

### Entry Criteria
- Phase 2 ended.

### Actions
1. Read conditions: `kubectl -n NS get deploy APP -o jsonpath='{range .status.conditions[*]}{.type}={.status} {.reason}: {.message}{"\n"}{end}'`.

| Observation | `rollout_result` |
|---|---|
| `rollout status` exit 0, `Progressing=True NewReplicaSetAvailable`, `Available=True` | `complete` |
| `Progressing=False ProgressDeadlineExceeded` (rollout status prints `error: deployment "APP" exceeded its progress deadline`) | `failed-deadline` |
| `rollout status` timed out (`error: timed out waiting for the condition`) while `Progressing=True` | `failed-timeout` |
| Phase 1 apply or sync failed | `failed-apply` |

2. A Deployment with `ProgressDeadlineExceeded` is NOT rolled back automatically by Kubernetes. The old ReplicaSet keeps serving only if `maxUnavailable` kept its pods; check `kubectl -n NS get rs -l app.kubernetes.io/name=APP` (DESIRED, CURRENT, READY per ReplicaSet).
3. Record `deployed_revision`: revision annotation after change, new ReplicaSet name (`kubectl -n NS get rs -l app.kubernetes.io/name=APP --sort-by=.metadata.creationTimestamp`, last line), previous revision from Phase 1, and the GitOps revision if any.
4. For `complete`, confirm the new image runs: `kubectl -n NS get pods -l app.kubernetes.io/name=APP -o jsonpath='{range .items[*]}{.status.containerStatuses[0].imageID}{"\n"}{end}' | sort -u` prints exactly one digest, the intended one.
5. `kubectl -n NS rollout history deployment/APP` shows the change cause on the newest revision.

### Output
`rollout_result`, `deployed_revision`.

### Quality Gate
- `rollout_result` matches one table row, with the conditions output copied.
- For `complete`, exactly one image digest is running and it matches the render.

---

## Worked Example

Illustrative only. `orders` in `shop`, `gitops_tool=none`, `progressDeadlineSeconds=600`.

Phase 1:
```
$ kubectl --context prod diff --server-side -f rendered/prod.yaml
-        image: ghcr.io/acme/orders@sha256:3f9c...e1
+        image: ghcr.io/acme/orders@sha256:a71d...09
$ kubectl --context prod apply --server-side --field-manager=deploy-pipeline -f rendered/prod.yaml
deployment.apps/orders serverside-applied
service/orders serverside-applied
```

Phase 2:
```
$ kubectl --context prod -n shop rollout status deployment/orders --timeout=660s
Waiting for deployment "orders" rollout to finish: 1 out of 3 new replicas have been updated...
error: deployment "orders" exceeded its progress deadline
```

Phase 3: `Progressing=False ProgressDeadlineExceeded: ReplicaSet "orders-6f8d7c9b54" has timed out progressing.` So `rollout_result=failed-deadline`; old ReplicaSet still has 3/3 READY because `maxUnavailable: 0`. Previous revision 14, new revision 15. Next: `k8s-pod-debug-triage`.

---

## Exit Criteria

DONE when the change is applied or synced, the rollout outcome is classified from Deployment conditions, and the revision record names both old and new revisions.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Context mismatch | **Stop**: confirm the target cluster with the user before any apply. |
| Phase 1 | `field is immutable` on apply | **Stop**: a selector or other immutable field changed; return to the manifest flow. |
| Phase 1 | Admission webhook denies | **Return**: to the flow that owns the denied field. |
| Phase 3 | Any `failed-*` result | **Return**: to `k8s-pod-debug-triage` with `deployed_revision`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
