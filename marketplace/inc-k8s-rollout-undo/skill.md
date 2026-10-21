# Incident Kubernetes Rollback

**One-line description:** Rolls a Kubernetes Deployment back to its last good revision with `kubectl rollout undo`, `helm rollback` or an Argo CD rollback, after pausing GitOps auto-sync so the rollback is not silently reverted, and confirms every pod runs the old image.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `mitigation_choice` (object, required): From `inc-stabilize-decision-table` with action "rollback".
- `k8s_namespace` (string, required): Namespace of the Deployment.
- `deployment_name` (string, required): Name of the Deployment (or Helm release, or Argo CD application).
- `gitops_tool` (string, optional): One of `none`, `helm`, `argocd`, `flux`. Defaults to `none` (plain kubectl).

---

## Outputs

- `rollback_result` (object): {method, from_revision, to_revision, image_before, image_after, rollout_status_output, gitops_sync_state, completed_at_utc}.

---

## Phase 1: Identify the Good Revision

### Entry Criteria
- `mitigation_choice.action` is "rollback" and approved.
- `kubectl auth can-i patch deployments -n <ns>` prints `yes`.

### Actions
1. Show current state and history:
   ```
   kubectl get deployment <name> -n <ns> -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}{" "}{.spec.template.spec.containers[*].image}{"\n"}'
   kubectl rollout history deployment/<name> -n <ns>
   kubectl rollout history deployment/<name> -n <ns> --revision=<N>
   ```
2. The good revision is the newest one created BEFORE the change named in `mitigation_choice`. Confirm by reading its image tag in the `--revision=<N>` output.
3. For Helm: `helm history <release> -n <ns>`; the good revision is the last one with STATUS `superseded` or `deployed` before the bad one.
4. For Argo CD: `argocd app history <app>`; note the ID of the last good sync.
5. Record image_before (the current image) and the good image.

### Output
The target revision number and its image.

### Quality Gate
- The target revision's image differs from image_before (if they are equal, the rollback would do nothing).
- `kubectl auth can-i` output is `yes`.

---

## Phase 2: Stop GitOps From Reverting

### Entry Criteria
- Target revision is known.

### Actions
1. Apply this table:

| `gitops_tool` | Action before rollback |
|---|---|
| none | nothing |
| helm | nothing; use `helm rollback` in Phase 3 so Helm's record stays correct |
| argocd | Disable auto-sync: `argocd app set <app> --sync-policy none`. Argo CD's `app rollback` requires auto-sync to be off. |
| flux | Suspend reconciliation: `flux suspend kustomization <name> -n <flux-ns>` or `flux suspend helmrelease <name> -n <ns>` |

2. Do NOT run `kubectl rollout undo` on an Argo CD or Flux managed Deployment without this step. The controller will reapply the bad revision within its sync interval and the rollback will look like it failed.
3. Record gitops_sync_state = "suspended" with the command used.

### Output
GitOps controller paused (or not applicable).

### Quality Gate
- For argocd: `argocd app get <app>` shows no automated sync policy.
- For flux: `flux get kustomizations` (or `flux get helmreleases`) shows SUSPENDED True for the object.

---

## Phase 3: Roll Back and Watch

### Entry Criteria
- GitOps is paused or not used.

### Actions
1. Run exactly one of:
   - kubectl: `kubectl rollout undo deployment/<name> -n <ns> --to-revision=<N>`
   - helm: `helm rollback <release> <N> -n <ns> --wait --timeout <duration>`
   - argocd: `argocd app rollback <app> <history-id>`
2. Watch: `kubectl rollout status deployment/<name> -n <ns> --timeout=<duration>`. Use the Deployment's own `progressDeadlineSeconds` (read it with `kubectl get deployment <name> -n <ns> -o jsonpath='{.spec.progressDeadlineSeconds}'`) as the timeout so the two agree.
3. Confirm every pod runs the good image:
   ```
   kubectl get pods -n <ns> -l <selector> -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.spec.containers[*].image}{" "}{.status.phase}{"\n"}{end}'
   ```
   Get the selector with `kubectl get deployment <name> -n <ns> -o jsonpath='{.spec.selector.matchLabels}'`.
4. Note: `kubectl rollout undo` creates a NEW revision number that copies the old template; the old number disappears from history. Record the new number.
5. Add an `action` entry to the timeline with the exact command and its output.
6. Leave GitOps paused. Re-enabling it is done only after the bad commit is reverted in git (see `inc-fix-verification`).

### Output
`rollback_result`.

### Quality Gate
- `kubectl rollout status` printed "successfully rolled out".
- Every pod line shows the good image and phase Running.

---

## Worked Example

Illustrative only. Namespace `shop`, Deployment `checkout`, `gitops_tool` = argocd.

- Phase 1: Current revision 42, image `registry.example.com/checkout:1.18.0`. `kubectl rollout history deployment/checkout -n shop --revision=41` shows `checkout:1.17.3`. `argocd app history checkout` shows ID 19 for 1.17.3.
- Phase 2: `argocd app set checkout --sync-policy none`; `argocd app get checkout` shows "Sync Policy: Manual" (illustrative output; check your version's wording).
- Phase 3: `argocd app rollback checkout 19`. `kubectl rollout status deployment/checkout -n shop --timeout=600s` prints `deployment "checkout" successfully rolled out`. Pod listing: 6 pods on `checkout:1.17.3`, Running. New revision 43. gitops_sync_state "suspended".

---

## Exit Criteria

DONE when all pods run the good image, rollout status reports success, the GitOps controller is paused, and `rollback_result` is recorded in the timeline.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Good revision was pruned by `revisionHistoryLimit` | **Adjust**: deploy the good image tag directly with `kubectl set image deployment/<name> <container>=<good-image> -n <ns>` and record it. |
| Phase 2 | No permission to change Argo CD sync policy | **Stop**: ask an Argo CD admin; do not run kubectl undo against an auto-syncing app. |
| Phase 3 | Rollout status times out | **Adjust**: run `kubectl describe pods -n <ns> -l <selector>` and read Events for ImagePullBackOff, FailedScheduling or failing probes; fix that cause. |
| Phase 3 | Errors continue after the good image is live | **Return**: the deploy was not the trigger; return to `inc-stabilize-decision-table` with the next row. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
