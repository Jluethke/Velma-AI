# Argo CD Application for the Workload

**One-line description:** Registers the chart or overlay with Argo CD as one `Application` per environment under a restricted `AppProject`, with automated sync, prune and self-heal, namespace labels managed through `managedNamespaceMetadata`, HPA-safe `ignoreDifferences`, and proves Synced and Healthy with `argocd app wait`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `chart_dir` (string, optional): From `k8s-helm-chart-build` when Helm is used.
- `kustomize_dir` (string, optional): From `k8s-kustomize-overlays` when Kustomize is used.
- `gitops_repo_url` (string, required): Git URL Argo CD reads, for example `https://github.com/acme/deploy.git`.
- `namespace` (string, required): Destination namespace.
- `app_name` (string, required): Workload name.
- `lint_report` (object, required): From `k8s-kube-linter-check`; must be `PASS`.

---

## Outputs

- `argocd_application` (object): `application_names` (per environment), `manifest_paths`, `project`, `sync_status`, `health_status`, `revision` (git SHA Argo CD synced), the `argocd app wait` output.

---

## Phase 1: Check Argo CD Prerequisites

### Entry Criteria
- `lint_report.overall` == `PASS`.
- Exactly one of `chart_dir` or `kustomize_dir` is present, and its files are committed and pushed: `git status --porcelain <dir>` prints nothing and `git log origin/<branch> -1 -- <dir>` shows the commit.

### Actions
1. `kubectl get crd applications.argoproj.io` exists. `argocd version` prints client and server versions (log in first with `argocd login <server>` or use `--core`).
2. Repository access: `argocd repo list` shows `gitops_repo_url` with `STATUS Successful`. If not, `argocd repo add <url>` with the credentials method the platform team uses (SSH key or token); never paste credentials into manifests.
3. Resource tracking method: `kubectl get cm argocd-cm -n argocd -o jsonpath='{.data.application\.resourceTrackingMethod}'`. Empty output means the version default: annotation tracking is the default since Argo CD 3.0; earlier versions defaulted to label tracking, which writes the Application name into `app.kubernetes.io/instance` on managed objects. With label tracking, note that the instance label on top-level objects will not equal the value in the manifests.
4. Kustomize version used by Argo CD: `argocd version` lists the bundled kustomize; it must build the overlays (`kustomize build` with that version, or check the release notes) since `labels` and `patches` need kustomize v4 or later.

### Output
Prerequisite results.

### Quality Gate
- `argocd repo list` shows the repo `Successful`.
- The source directory's commit is on the remote branch.

---

## Phase 2: Write the AppProject and Applications

### Entry Criteria
- Prerequisites pass.

### Actions
1. `appproject.yaml` (skip if the platform provides one; then record its name):
```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata: { name: <team>, namespace: argocd }
spec:
  sourceRepos: [<gitops_repo_url>]
  destinations:
    - { server: https://kubernetes.default.svc, namespace: <namespace> }
  clusterResourceWhitelist:
    - { group: "", kind: Namespace }
```
   Do not put apps in the `default` project: it allows every repository and destination.
2. One Application per environment, file `argocd/<app>-<env>.yaml`:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: <app>-<env>
  namespace: argocd
  finalizers: [resources-finalizer.argocd.argoproj.io]
spec:
  project: <team>
  source:
    repoURL: <gitops_repo_url>
    targetRevision: main
    path: <kustomize_dir>/overlays/<env>          # Kustomize
    # path: <chart_dir>                            # Helm
    # helm: { valueFiles: [values-<env>.yaml], releaseName: <app> }
  destination: { server: https://kubernetes.default.svc, namespace: <namespace> }
  syncPolicy:
    automated: { prune: true, selfHeal: true }
    syncOptions: [CreateNamespace=true, ServerSideApply=true, RespectIgnoreDifferences=true]
    managedNamespaceMetadata:
      labels:
        pod-security.kubernetes.io/enforce: restricted
        pod-security.kubernetes.io/enforce-version: <cluster minor>
  ignoreDifferences:
    - { group: apps, kind: Deployment, name: <app>, jsonPointers: [/spec/replicas] }
```
   - `ignoreDifferences` on `/spec/replicas` is needed only when an HPA exists and the manifest still sets replicas; with `RespectIgnoreDifferences=true` the sync does not overwrite the HPA's count.
   - The `resources-finalizer.argocd.argoproj.io` finalizer deletes the managed objects when the Application is deleted. Omit it if the objects must survive Application deletion.
   - Argo CD renders Helm charts with its own templating; `helm list` shows no release for these apps. Helm hooks are mapped to Argo CD hooks.
3. Many environments or clusters: an `ApplicationSet` with a `list` generator produces the same Applications from one file. Use it when there are more environments than the team wants to edit by hand; keep plain Applications otherwise.
4. Sync order: when a database migration Job must run first, annotate it `argocd.argoproj.io/hook: PreSync` and `argocd.argoproj.io/hook-delete-policy: BeforeHookCreation`.

### Output
Project and Application files.

### Quality Gate
- `kubectl apply --dry-run=server -f argocd/` prints `(server dry run)` for each file.
- `yq '.spec.project' argocd/*.yaml` never prints `default`.

---

## Phase 3: Sync and Prove

### Entry Criteria
- Files committed to the repo that bootstraps Argo CD apps, or applied: `kubectl apply -n argocd -f argocd/`.

### Actions
1. Preview: `argocd app diff <app>-<env>`. Exit code 1 means differences exist (expected on first sync); exit code 2 or more is an error.
2. Wait: `argocd app wait <app>-<env> --sync --health --timeout <seconds>` where the timeout covers the Deployment's `progressDeadlineSeconds`.
3. Read status: `argocd app get <app>-<env>`.

| Sync / Health | Meaning | Action |
|---|---|---|
| `Synced` / `Healthy` | Done | Record revision |
| `Synced` / `Progressing` | Rollout running | Keep waiting up to the timeout |
| `Synced` / `Degraded` | Deployment exceeded its progress deadline or pods fail | Go to `k8s-pod-debug-triage` |
| `OutOfSync` after sync | A field is changed by a controller (HPA, webhook defaulting) | Add a targeted `ignoreDifferences`; do not disable selfHeal |
| `Unknown` / sync error `ComparisonError` | Render failed in Argo CD | `argocd app get <app>-<env> --show-operation` and read the message |

4. Record `revision` from `argocd app get` (the `Sync Revision` or `Revision` line, depending on the CLI version).

### Output
`argocd_application`.

### Quality Gate
- `argocd app wait` exits 0.
- `argocd app get` shows `Synced` and `Healthy` for every environment Application.

---

## Worked Example

Illustrative only. `orders`, kustomize overlays, environments `staging` and `prod`, Argo CD 3.1, HPA present.

Phase 1: repo `Successful`; tracking method empty, so annotation tracking (3.x default).

Phase 3:
```
$ argocd app wait orders-staging --sync --health --timeout 660
Name:               argocd/orders-staging
Sync Status:        Synced to main (4be1c2a)
Health Status:      Healthy
GROUP  KIND        NAMESPACE  NAME    STATUS  HEALTH   HOOK  MESSAGE
       Service     shop-stg   orders  Synced  Healthy        service/orders serverside-applied
apps   Deployment  shop-stg   orders  Synced  Healthy        deployment.apps/orders serverside-applied
```
Timeout 660 = `progressDeadlineSeconds` 600 plus image pull allowance recorded by the owner.

---

## Exit Criteria

DONE when each environment's Application is in a restricted project, automated with prune and self-heal, and reports `Synced` and `Healthy` at a recorded git revision.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `lint_report` is not PASS | **Stop**: GitOps would deploy unvalidated manifests. |
| Phase 1 | Repo `Failed` in `argocd repo list` | **Adjust**: fix credentials through `argocd repo add`; never commit them. |
| Phase 3 | `Degraded` | **Return**: to `k8s-pod-debug-triage` with the Application name. |
| Phase 3 | Perpetual `OutOfSync` on one field | **Adjust**: targeted `ignoreDifferences` with the exact pointer and a comment naming the controller. |
| Phase 3 | `the server could not find the requested resource` for a CRD | **Adjust**: the CRD must be installed before the custom resource; use sync waves (`argocd.argoproj.io/sync-wave`). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
