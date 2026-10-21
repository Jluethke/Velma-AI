# Flux GitRepository, Kustomization and HelmRelease for the Workload

**One-line description:** Connects the overlay or chart to Flux with a `GitRepository` source and a `kustomize.toolkit.fluxcd.io/v1` Kustomization (or a `helm.toolkit.fluxcd.io/v2` HelmRelease), with `wait`, `prune`, `dependsOn` for the namespace, SOPS decryption when used, and proves readiness with `flux reconcile` and `flux get`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `chart_dir` (string, optional): From `k8s-helm-chart-build` when Helm is used.
- `kustomize_dir` (string, optional): From `k8s-kustomize-overlays` when Kustomize is used.
- `gitops_repo_url` (string, required): Git URL Flux reads.
- `namespace` (string, required): Destination namespace.
- `app_name` (string, required): Workload name.
- `lint_report` (object, required): From `k8s-kube-linter-check`; must be `PASS`.

---

## Outputs

- `flux_resources` (object): `source_name`, `kustomization_names` or `helmrelease_names` per environment, `manifest_paths`, `ready_status`, `applied_revision`, the `flux get` output.

---

## Phase 1: Check Flux Prerequisites

### Entry Criteria
- `lint_report.overall` == `PASS`.
- Exactly one of `chart_dir` or `kustomize_dir` is present and committed to the remote branch.

### Actions
1. `flux check` prints the controller versions and `all checks passed`. A failure means Flux is not installed or unhealthy; do not continue.
2. Find the existing cluster sync layout: `flux get kustomizations -A`. The bootstrap Kustomization (often `flux-system`) applies a directory such as `clusters/<cluster>/`. New Flux objects go into that directory so Flux applies them; record the path.
3. Check the source: `flux get sources git -A`. If a `GitRepository` for `gitops_repo_url` already exists, reuse it.
4. When `k8s-configmap-secret-wiring` used `sops`, confirm the decryption key Secret exists in `flux-system`: `kubectl get secret -n flux-system sops-age` (or the platform's name).

### Output
Prerequisite results and the cluster sync path.

### Quality Gate
- `flux check` output ends with `all checks passed`.
- The cluster sync path is recorded from `flux get kustomizations -A` and the repository tree.

---

## Phase 2: Write the Flux Objects

### Entry Criteria
- Prerequisites pass.

### Actions
1. Source (only if none exists), generated rather than typed:
```bash
flux create source git <repo-name> --url=<gitops_repo_url> --branch=main --interval=<source interval> --export > clusters/<cluster>/<app>-source.yaml
```
   The interval is how often Flux polls git; use the value the platform already uses for other sources and record it.
2. Namespace Kustomization, so the namespace with Pod Security labels exists first: path `deploy/kustomize/namespaces` (or a directory holding `namespace.yaml`), named `<app>-namespace`.
3. Kustomize case, one per environment:
```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata: { name: <app>-<env>, namespace: flux-system }
spec:
  interval: <reconcile interval>
  retryInterval: <retry interval>
  timeout: <covers progressDeadlineSeconds>
  path: ./<kustomize_dir>/overlays/<env>
  prune: true
  wait: true
  sourceRef: { kind: GitRepository, name: <repo-name> }
  dependsOn: [ { name: <app>-namespace } ]
  # decryption: { provider: sops, secretRef: { name: sops-age } }   # only with sops
```
   - `wait: true` makes the Kustomization Ready only when every applied object is healthy (Deployments rolled out), and `timeout` bounds that wait; set it above the Deployment's `progressDeadlineSeconds`.
   - `prune: true` deletes objects removed from git.
   - Flux applies server-side. Leave `spec.replicas` out of the manifest when an HPA manages it; Flux Kustomization has no ignore-differences field for this.
4. Helm case, one HelmRelease per environment:
```yaml
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata: { name: <app>-<env>, namespace: <namespace> }
spec:
  interval: <reconcile interval>
  timeout: <covers progressDeadlineSeconds>
  chart:
    spec:
      chart: ./<chart_dir>
      sourceRef: { kind: GitRepository, name: <repo-name>, namespace: flux-system }
      valuesFiles: [ ./<chart_dir>/values.yaml, ./<chart_dir>/values-<env>.yaml ]
  install: { remediation: { retries: <n> } }
  upgrade: { remediation: { retries: <n>, remediateLastFailure: true } }
  dependsOn: [ { name: <app>-namespace, namespace: flux-system } ]
```
   Retry counts are the owner's choice; record them. With `remediateLastFailure: true` a failed upgrade is rolled back after the last retry. Confirm field names against the installed CRD: `kubectl explain helmrelease.spec.upgrade.remediation`.
5. Validate before committing: `flux diff kustomization <bootstrap name> --path ./clusters/<cluster>` shows what will change (exit code 1 when there are differences).

### Output
Flux object files committed under the cluster sync path.

### Quality Gate
- `kubectl apply --dry-run=server -f <each new file>` prints `(server dry run)`.
- Every Kustomization or HelmRelease has `dependsOn` the namespace object.

---

## Phase 3: Reconcile and Prove

### Entry Criteria
- Files pushed to the branch Flux watches.

### Actions
1. `flux reconcile kustomization <bootstrap name> --with-source` to pull the new objects now instead of waiting for the interval.
2. `flux reconcile kustomization <app>-<env> --with-source` (or `flux reconcile helmrelease <app>-<env> -n <namespace> --with-source`).
3. `flux get kustomizations <app>-<env>` (or `flux get helmreleases -n <namespace>`) and read READY and MESSAGE:

| READY / MESSAGE | Meaning | Action |
|---|---|---|
| `True` / `Applied revision: main@sha1:<sha>` | Applied and healthy | Record `applied_revision` |
| `Unknown` / `Reconciliation in progress` | Waiting on health | Wait up to `timeout` |
| `False` / `health check failed after ...` | A Deployment did not roll out | Go to `k8s-pod-debug-triage` |
| `False` / `kustomize build failed` | Overlay does not build in Flux's kustomize | Run `kustomize build` locally with the same path and fix |
| `False` / `dependency '<ns>/<name>' is not ready` | Namespace Kustomization not Ready | Fix that one first |

4. Events for detail: `flux events --for Kustomization/<app>-<env>`; controller logs: `flux logs --kind=Kustomization --name=<app>-<env>`.
5. `flux tree kustomization <app>-<env>` lists the objects Flux manages; compare with the rendered file's kinds.

### Output
`flux_resources`.

### Quality Gate
- `flux get` shows READY `True` with `Applied revision` for every environment.
- `flux tree` lists every kind present in the rendered manifests.

---

## Worked Example

Illustrative only. `orders`, kustomize overlays, environment `prod`, sops in use.

Phase 1:
```
$ flux check
► checking prerequisites
✔ Kubernetes 1.31.4 >=1.30.0-0
► checking version in cluster
✔ distribution: flux-v2.6.1
✔ all checks passed
```

Phase 3:
```
$ flux reconcile kustomization orders-prod --with-source
► annotating GitRepository deploy in flux-system namespace
✔ fetched revision main@sha1:4be1c2a9
► annotating Kustomization orders-prod in flux-system namespace
✔ applied revision main@sha1:4be1c2a9
$ flux get kustomizations orders-prod
NAME         REVISION              SUSPENDED  READY  MESSAGE
orders-prod  main@sha1:4be1c2a9    False      True   Applied revision: main@sha1:4be1c2a9
```

---

## Exit Criteria

DONE when each environment's Kustomization or HelmRelease depends on its namespace, waits for health, and reports READY `True` at a recorded revision.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `flux check` fails | **Stop**: report the failing controller; installing Flux is a platform task. |
| Phase 2 | `explain` shows a different field layout | **Adjust**: follow the installed CRD's fields, not the example. |
| Phase 3 | `decryption failed` | **Adjust**: the SOPS key Secret or `.sops.yaml` recipients do not match; re-encrypt for the cluster's public key. |
| Phase 3 | `health check failed` | **Return**: to `k8s-pod-debug-triage`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
