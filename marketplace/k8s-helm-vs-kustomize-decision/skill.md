# Helm vs Kustomize Decision

**One-line description:** Chooses Helm or Kustomize for one application with an explicit decision table (consumers, environment differences, hooks, existing repository tooling, GitOps controller support) and fixes the directory layout every later flow writes into.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workload_profile` (object, required): Output of `k8s-workload-inventory`.
- `environments` (string[], required): Environment names in promotion order, for example `["dev","staging","prod"]`.
- `repo_dir` (string, required): Repository that will hold the deployment files (the application repository or a separate config repository).

---

## Outputs

- `packaging_choice` (string): `helm` or `kustomize`.
- `manifest_layout` (object): `root` (directory), `files` (planned file paths), `environments`, `per_env_differences` (field paths that differ per environment), and `reason` (the table row that decided).

---

## Phase 1: Collect the Facts the Table Needs

### Entry Criteria
- `workload_profile.workload_kind` == `Deployment`.
- `environments` has at least one entry.

### Actions
1. Check what already exists. Run each command and record the result:
   - `find "$REPO" -name Chart.yaml -not -path '*/node_modules/*'`
   - `find "$REPO" -name kustomization.yaml -o -name kustomization.yml -o -name Kustomization`
   - `find "$REPO" -path '*/templates/*.yaml' | head`
2. List who installs this application. Answer each with yes or no from the README, issue tracker or the user:
   - Q1: Is the application installed by people outside the owning team (customers, other companies, open source users)?
   - Q2: Must installers change values the owning team cannot predict (their own hostnames, storage classes, replica counts)?
   - Q3: Does the release need ordered lifecycle steps (database migration before the new pods start, cleanup after delete)?
3. For each environment pair, list the fields that differ (replicas, image tag, hostname, resource numbers, ConfigMap values). Write them to `per_env_differences` as field paths, for example `spec.replicas`, `spec.template.spec.containers[0].image`, `spec.rules[0].host`.
4. Record the GitOps controller if one exists: `kubectl get crd applications.argoproj.io` (Argo CD) and `kubectl get crd kustomizations.kustomize.toolkit.fluxcd.io` (Flux). Both controllers support Helm charts and Kustomize directories, so this only changes file layout, not the choice.

### Output
Facts list: existing files, Q1 to Q3 answers, `per_env_differences`.

### Quality Gate
- Each of the three `find` commands has its output recorded (empty output written as "none").
- Q1, Q2 and Q3 each have a yes or no answer with a source.

---

## Phase 2: Apply the Decision Table

### Entry Criteria
- Phase 1 facts recorded.

### Actions
1. Use the first row that matches. Do not average rows or pick by preference.

| Row | Condition | `packaging_choice` |
|---|---|---|
| R1 | A `Chart.yaml` for this application already exists and renders (`helm template x <chartdir>` exits 0) | `helm` |
| R2 | A `kustomization.yaml` for this application already exists and builds (`kubectl kustomize <dir>` exits 0) | `kustomize` |
| R3 | Q1 = yes or Q2 = yes | `helm` (installers need a values interface and versioned chart releases) |
| R4 | Q3 = yes and no GitOps controller exists | `helm` (Helm hooks `helm.sh/hook: pre-upgrade` run migrations; plain `kubectl apply -k` has no ordering) |
| R5 | Every entry in `per_env_differences` is a replica count, image, label, annotation, namespace, ConfigMap/Secret literal, or a small field patch | `kustomize` |
| R6 | Environments differ in which objects exist (an Ingress only in prod, extra sidecars only in staging) or in loops over lists | `helm` |
| R7 | None of the above | `kustomize` (plain YAML, no template language, `kubectl` builds it natively) |

2. Write `reason` as the row id plus the fact that triggered it.
3. If R4 applied but a GitOps controller exists, note the alternative: Argo CD sync hooks (`argocd.argoproj.io/hook: PreSync`) or a Flux Kustomization `dependsOn` can order a migration Job. Keep the R4 result; record the alternative in `reason`.

### Output
`packaging_choice` and `reason`.

### Quality Gate
- `reason` names exactly one row id from the table.
- If R1 or R2 applied, the render command was actually run and its exit code (0) is recorded.

---

## Phase 3: Fix the Directory Layout

### Entry Criteria
- `packaging_choice` decided.

### Actions
1. If `packaging_choice` == `helm`, plan this layout under `deploy/helm/<app_name>/`:
   - `Chart.yaml`, `values.yaml`, `values.schema.json`, one `values-<env>.yaml` per environment, `templates/_helpers.tpl`, `templates/deployment.yaml`, `templates/service.yaml`, `templates/ingress.yaml`, `templates/configmap.yaml`, `templates/pdb.yaml`, `templates/hpa.yaml`, `templates/networkpolicy.yaml`, `templates/NOTES.txt`.
2. If `packaging_choice` == `kustomize`, plan this layout under `deploy/kustomize/<app_name>/`:
   - `base/kustomization.yaml`, `base/deployment.yaml`, `base/service.yaml`, `base/configmap.yaml` (or a `configMapGenerator`), `base/pdb.yaml`, `base/hpa.yaml`, `base/networkpolicy.yaml`, and `overlays/<env>/kustomization.yaml` per environment, plus `overlays/<env>/ingress.yaml` when the hostname differs.
3. Until the packaging flow runs, earlier flows write plain manifests into `deploy/raw/<app_name>/` with one object per file. The packaging flow later moves them into the chosen layout. Record this staging directory as `manifest_layout.root`.
4. Do not create the Helm or Kustomize files in this flow. This flow only decides and plans.

### Output
`manifest_layout`.

### Quality Gate
- `manifest_layout.files` lists one planned path per object kind the application needs (at least Deployment and Service).
- `manifest_layout.environments` equals the `environments` input in the same order.

---

## Worked Example

Illustrative only. Input: `orders` service, `environments=["staging","prod"]`.

Phase 1:
```
$ find /src/orders -name Chart.yaml -not -path '*/node_modules/*'
(no output)
$ find /src/orders -name kustomization.yaml -o -name kustomization.yml -o -name Kustomization
(no output)
$ kubectl get crd applications.argoproj.io
NAME                       CREATED AT
applications.argoproj.io   2025-11-02T10:14:51Z
```
Q1 no (internal service), Q2 no, Q3 yes (Alembic migration). Differences: `spec.replicas`, image tag, `spec.rules[0].host`, ConfigMap `LOG_LEVEL`.

Phase 2: R1 and R2 do not match. R3 no. R4 does not apply because Argo CD exists. R5 matches every difference. `packaging_choice=kustomize`, `reason="R5: differences are replicas, image, host and a ConfigMap literal; migration ordered by Argo CD PreSync hook"`.

Phase 3: `manifest_layout.root=deploy/raw/orders`, final layout `deploy/kustomize/orders/base` plus `overlays/staging` and `overlays/prod`.

---

## Exit Criteria

DONE when `packaging_choice` is set by one cited table row and `manifest_layout` lists every planned file.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Both a chart and a kustomization already exist for the app | **Stop**: ask which one is deployed today (`helm list -A` shows Helm releases); do not maintain two. |
| Phase 1 | Q1 to Q3 cannot be answered from the repository | **Return**: ask the user; do not assume. |
| Phase 2 | Existing chart fails `helm template` | **Adjust**: record the error and evaluate from R3 onward; fixing the old chart is a separate task. |
| Phase 3 | Repository already has a `deploy/` directory with other content | **Adjust**: use `deploy/<app_name>/` under the existing convention and record the path. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
