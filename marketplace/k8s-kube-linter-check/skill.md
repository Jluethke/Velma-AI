# Lint Rendered Manifests with kube-linter

**One-line description:** Runs kube-linter with all built-in checks on every rendered environment, records each finding with its check name and remediation, fixes findings at the source, and allows an exception only through a per-object `ignore-check.kube-linter.io/<check>` annotation carrying a written reason.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `helm_rendered_manifests` (object, optional): From `k8s-helm-chart-build`.
- `kustomize_rendered_manifests` (object, optional): From `k8s-kustomize-overlays`.
- `schema_report` (object, required): From `k8s-kubeconform-validate`; must be `PASS`.
- `repo_dir` (string, required): Repository where `.kube-linter.yaml` lives.

---

## Outputs

- `lint_report` (object): Per environment: findings (object, check, message, remediation, resolution `fixed` or `ignored` with reason), the config file path, the exact command, and overall `PASS` or `FAIL`.

---

## Phase 1: Configure kube-linter

### Entry Criteria
- `schema_report.overall` == `PASS`. Linting an invalid manifest gives misleading findings.

### Actions
1. `kube-linter version` prints a version. Install from the stackrox/kube-linter GitHub releases or `brew install kube-linter` if missing.
2. `kube-linter checks list` prints every check with its description and whether it is enabled by default. Save the output to the run notes; check names below must come from this list, not memory.
3. Write `.kube-linter.yaml` at `repo_dir`:
```yaml
checks:
  addAllBuiltIn: true
  exclude: []
```
   `addAllBuiltIn: true` enables the non-default checks as well. Adding names to `exclude` turns a check off for every object; only do that for a check that cannot apply to this repository (record why, for example a check that requires an `owner` label the organization does not use).
4. Do NOT disable a check globally to make one object pass. Per-object exceptions use annotations (Phase 3).

### Output
Config file and the saved check list.

### Quality Gate
- `.kube-linter.yaml` exists and every `exclude` entry has a comment with a reason.

---

## Phase 2: Run and Read Findings

### Entry Criteria
- Config written.

### Actions
1. Run per environment: `kube-linter lint --config "$REPO/.kube-linter.yaml" rendered/<env>.yaml`. Exit code 0 means no findings; 1 means findings.
2. For CI artifacts also run with `--format json` (or `--format sarif` for code scanning upload) and save the file.
3. Each finding line has this form:
```
rendered/prod.yaml: (object: <namespace>/<name> <apiVersion>, Kind=<Kind>) <message> (check: <check-name>, remediation: <text>)
```
   Copy each finding into `lint_report` with object, check and remediation.
4. Map findings to the flow that owns the fix:

| Check name contains | Owner flow to fix in |
|---|---|
| `read-only-root-fs`, `run-as-non-root`, `privilege-escalation`, `privileged`, `capabilities`, `host` | `k8s-security-context-hardening` |
| `cpu-requirements`, `memory-requirements` | `k8s-requests-limits-from-usage` |
| `liveness-probe`, `readiness-probe` | `k8s-probe-tuning` |
| `latest-tag` | `k8s-deployment-manifest` |
| `pdb-`, `replicas` | `k8s-rolling-update-pdb` |
| `dangling-service`, `mismatching-selector`, `dangling-networkpolicy`, `dangling-horizontalpodautoscaler` | The flow that wrote that object; the selector does not match any pod |
| `env-var-secret` | `k8s-configmap-secret-wiring` (a secret-like value is inline in `env`) |
| `anti-affinity` | `k8s-rolling-update-pdb` (spread rules) |

### Output
Findings table with owners.

### Quality Gate
- Every finding line from the output appears in the table with an owner flow.

---

## Phase 3: Resolve Each Finding

### Entry Criteria
- Findings table complete.

### Actions
1. Fix at the source (raw manifest plus chart or overlay), then re-render, rerun `k8s-kubeconform-validate`, and rerun this flow. Fix one finding per change so a regression is traceable.
2. Exception rule: a finding may be ignored only when the remediation would be wrong for this workload, for example `no-anti-affinity` when `topologySpreadConstraints` already spread the pods. Add the annotation to that object's metadata in the source:
```yaml
metadata:
  annotations:
    ignore-check.kube-linter.io/no-anti-affinity: "spread by topologySpreadConstraints on zone and hostname"
```
   The reason string must say what replaces the check. An empty reason is not allowed.
3. Never resolve a finding by deleting the object, removing probes, or removing resource requests.
4. Final run: every environment exits 0. Write `lint_report.overall`.

### Output
`lint_report`.

### Quality Gate
- `kube-linter lint --config .kube-linter.yaml rendered/<env>.yaml; echo "exit=$?"` prints `exit=0` for every environment.
- `grep -rn "ignore-check.kube-linter.io" <source dir>` lists only annotations with non-empty reasons.

---

## Worked Example

Illustrative only. `orders`, kustomize renders for staging and prod.

Phase 2:
```
$ kube-linter lint --config .kube-linter.yaml rendered/prod.yaml
KubeLinter 0.7.1

rendered/prod.yaml: (object: shop/orders apps/v1, Kind=Deployment) container "migrate" does not have a read-only root file system (check: no-read-only-root-fs, remediation: Set readOnlyRootFilesystem to true in the container securityContext.)
rendered/prod.yaml: (object: shop/orders apps/v1, Kind=Deployment) no pod anti-affinity rules found (check: no-anti-affinity, remediation: Specify anti-affinity in your pod specification to ensure that the orchestrator attempts to schedule replicas on different nodes. ...)

Error: found 2 lint errors
```
The first finding is a migration init container added only in the prod overlay without the hardened securityContext; fixed in `overlays/prod/migrate-patch.yaml` (owner `k8s-security-context-hardening`). The anti-affinity finding was ignored on the Deployment with the spread reason. Final run:
```
No lint errors found!
```

---

## Exit Criteria

DONE when every environment lints clean with all built-in checks enabled and every ignore annotation carries a reason that names what replaces the check.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `schema_report` is FAIL | **Stop**: return to `k8s-kubeconform-validate`. |
| Phase 2 | Unknown check name in config | **Adjust**: copy names from `kube-linter checks list`. |
| Phase 3 | Fix for one finding causes another | **Retry**: fix one finding at a time and rerun after each. |
| Phase 3 | Owner asks to exclude a check globally | **Return**: require a written reason in `.kube-linter.yaml` and record who approved it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
