# Roll Back a Failed Deployment Rollout

**One-line description:** Restores the last good version after evidence is saved, choosing the rollback path that matches the delivery method (`kubectl rollout undo --to-revision`, `git revert` for Argo CD auto-sync and Flux, or `helm rollback` for Helm-CLI releases), and knows what an undo does NOT revert (ConfigMaps, Secrets, Services, HPA, PDB).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cluster_context` (string, required): kubeconfig context.
- `namespace` (string, required): Namespace.
- `app_name` (string, required): Deployment name.
- `deployed_revision` (object, required): From `k8s-rollout-status-watch`; holds previous and new revision numbers and the git revision.
- `triage_report` (object, required): From `k8s-pod-debug-triage`; its `evidence_dir` must exist before rollback.
- `gitops_tool` (string, required): `argocd`, `flux` or `none`.

---

## Outputs

- `undo_result` (object): `method`, `restored_revision`, `rollout_status_output`, `running_image_digest`, `not_reverted` (objects the undo did not touch that changed in the failed release), `follow_up`.

---

## Phase 1: Choose the Rollback Method

### Entry Criteria
- `triage_report.evidence_dir` exists and is non-empty. If not, **Stop** and run `k8s-pod-debug-triage` first.

### Actions
1. Detect Helm CLI management: `kubectl -n NS get deploy APP -o jsonpath='{.metadata.labels.app\.kubernetes\.io/managed-by}'` prints `Helm` and `helm list -n NS` lists a release.
2. Choose:

| Delivery | Method |
|---|---|
| `gitops_tool` == `argocd` with automated sync | `git revert <bad commit>` and push. `argocd app rollback` is refused while auto-sync is enabled, and a manual `kubectl rollout undo` is reverted by self-heal |
| `gitops_tool` == `argocd` without automated sync | `argocd app history <app>-<env>` then `argocd app rollback <app>-<env> <history id>`, followed by a `git revert` so git matches the cluster |
| `gitops_tool` == `flux` | `git revert <bad commit>` and push, then `flux reconcile kustomization <name> --with-source`. For an urgent stop, `flux suspend kustomization <name>` first, then `kubectl rollout undo`, then revert git and `flux resume` |
| Helm CLI release (no GitOps) | `helm history <release> -n NS`, then `helm rollback <release> <revision> -n NS --wait` (on Helm 4 confirm flags with `helm rollback --help`) |
| Plain `kubectl apply` | `kubectl rollout undo` (Phase 2) |

3. Find the target revision for `kubectl` undo: `kubectl -n NS rollout history deployment/APP`. The target is `deployed_revision.previous` unless the history shows that revision was also bad. Inspect it: `kubectl -n NS rollout history deployment/APP --revision=<n>` and confirm the image digest is the last known good one.

### Output
Method and target revision.

### Quality Gate
- The method row is named, and for `kubectl` undo the target revision's image digest is quoted from `rollout history --revision` output.

---

## Phase 2: Execute the Rollback

### Entry Criteria
- Method chosen. Only one person or pipeline performs the rollback; announce it in the team channel the owner names.

### Actions
1. `kubectl` undo: `kubectl --context "$CTX" -n NS rollout undo deployment/APP --to-revision=<n>`. Always pass `--to-revision`; without it, undo goes to the immediately previous revision, which after repeated attempts may be another bad one.
2. Git revert path: `git revert --no-edit <bad commit sha>` then `git push`. Do not force-push to remove the bad commit; the revert is the audit record.
3. Watch: `kubectl --context "$CTX" -n NS rollout status deployment/APP --timeout=<progressDeadlineSeconds + pull allowance>s` (for GitOps also `argocd app wait ... --health` or `flux get kustomizations <name>`).
4. Note: `kubectl rollout undo` copies the old pod template into a NEW revision number (for example revision 14 comes back as revision 16). That is expected.

### Output
Rollback executed and watched.

### Quality Gate
- The watch command printed `successfully rolled out` (or Healthy / READY True for GitOps).

---

## Phase 3: Verify and List What Was Not Reverted

### Entry Criteria
- Rollout complete.

### Actions
1. Running digest: `kubectl -n NS get pods -l app.kubernetes.io/name=APP -o jsonpath='{range .items[*]}{.status.containerStatuses[0].imageID}{"\n"}{end}' | sort -u` prints exactly one digest, the last good one.
2. `kubectl rollout undo` and `argocd app rollback` restore only what the method covers:

| Object changed in the failed release | Reverted by `kubectl rollout undo` | Reverted by `git revert` + sync |
|---|---|---|
| Pod template (image, env, probes, resources) | Yes | Yes |
| ConfigMap or Secret content (same name) | No | Yes for ConfigMaps in git; ExternalSecret source values No |
| Kustomize generated ConfigMap (hash name) | Yes, the old template references the old hashed name if it still exists | Yes |
| Service, Ingress, HPA, PDB, NetworkPolicy | No | Yes |
| Database schema migrations | No | No |

3. Compare the failed release's diff (saved from `kubectl diff` in `k8s-rollout-status-watch`) with the table. List every object the chosen method did not revert in `not_reverted`, and restore each from git with `kubectl apply --server-side` if `gitops_tool` is `none`.
4. Database migration rule: if the failed release ran a schema migration, record it in `follow_up`. Rolling back code over a migrated schema may fail; the migration's down path is a separate, reviewed change.
5. Error rate check: rerun the request loop from `k8s-rolling-update-pdb` Phase 3 for the owner's chosen duration; `fail` must be 0.

### Output
`undo_result`.

### Quality Gate
- Exactly one image digest runs and it equals the target revision's digest.
- `not_reverted` is filled or states "none" after comparing with the saved diff.

---

## Worked Example

Illustrative only. `orders`, `gitops_tool=none`, previous revision 14, failed revision 15 (OOMKilled crash loop).

Phase 1:
```
$ kubectl -n shop rollout history deployment/orders
REVISION  CHANGE-CAUSE
13        orders 1.4.0
14        orders 1.4.1
15        orders 1.4.2: add readiness probe
$ kubectl -n shop rollout history deployment/orders --revision=14 | grep Image
    Image:	ghcr.io/acme/orders@sha256:3f9c...e1
```

Phase 2:
```
$ kubectl -n shop rollout undo deployment/orders --to-revision=14
deployment.apps/orders rolled back
$ kubectl -n shop rollout status deployment/orders --timeout=660s
deployment "orders" successfully rolled out
```

Phase 3: one digest `sha256:3f9c...e1`. The failed release also changed ConfigMap `orders-config` (same name, `LOG_LEVEL=debug`); restored from git and applied. `not_reverted=["ConfigMap orders-config (restored manually)"]`. No migration ran. Request loop `fail=0`.

---

## Exit Criteria

DONE when the last good version runs as the only digest, every object the method did not revert is listed and handled, and git matches the cluster.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Evidence not captured | **Stop**: capture first unless the owner explicitly accepts losing it to restore service. |
| Phase 1 | `argocd app rollback` refused (auto-sync) | **Adjust**: use the `git revert` row. |
| Phase 2 | Undo target revision no longer in history (`revisionHistoryLimit` reached) | **Adjust**: redeploy the last good digest from git. |
| Phase 3 | Old version also fails | **Return**: to `k8s-pod-debug-triage`; the cause is outside the release (dependency, config, cluster). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
