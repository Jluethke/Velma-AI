# Validate Rendered Manifests with kubeconform

**One-line description:** Validates every rendered environment against the JSON schemas of the cluster's exact Kubernetes version with `kubeconform -strict`, adds a CRD schema source for Argo CD, External Secrets and other custom resources so they are checked instead of skipped, and treats any Skipped resource as unverified.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `helm_rendered_manifests` (object, optional): From `k8s-helm-chart-build`; map of environment to file.
- `kustomize_rendered_manifests` (object, optional): From `k8s-kustomize-overlays`; map of environment to file.
- `kubernetes_version` (string, required): The target cluster's version in `MAJOR.MINOR.PATCH` form, read from `kubectl version` (Server Version line), for example `1.31.4`.

---

## Outputs

- `schema_report` (object): Per environment: `valid`, `invalid`, `errors`, `skipped` counts, every invalid or skipped resource with its message, the exact command run, and an overall `PASS` or `FAIL`.

---

## Phase 1: Prepare Inputs and Schema Sources

### Entry Criteria
- Exactly one of `helm_rendered_manifests` or `kustomize_rendered_manifests` is present and every listed file exists.

### Actions
1. Install check: `kubeconform -v` prints a version. If missing, install from the project's GitHub releases or `go install github.com/yannh/kubeconform/cmd/kubeconform@latest`; do not substitute `kubeval` (unmaintained).
2. List the kinds in each render: `yq -N '.apiVersion + " " + .kind' rendered/<env>.yaml | sort | uniq -c`.
3. Classify each apiVersion:

| apiVersion group | Schema source |
|---|---|
| Core and built-in groups (`v1`, `apps/v1`, `networking.k8s.io/v1`, `policy/v1`, `autoscaling/v2`) | `-schema-location default` |
| CRD groups (`argoproj.io`, `external-secrets.io`, `bitnami.com`, `cert-manager.io`, `monitoring.coreos.com`, `kustomize.toolkit.fluxcd.io`, ...) | The community CRDs catalog: `-schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json'` |
| CRD missing from the catalog | Generate a schema from the live CRD with the `openapi2jsonschema.py` script shipped in the kubeconform repository, store it under `schemas/`, add `-schema-location 'schemas/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json'` |

4. In air-gapped CI, mirror the schemas and point `-schema-location` at the local copy; record that the mirror must match `kubernetes_version`.

### Output
Kind list and schema location flags.

### Quality Gate
- Every kind from step 2 maps to a schema source row.

---

## Phase 2: Run kubeconform

### Entry Criteria
- Schema sources decided.

### Actions
1. Run per environment:
```bash
kubeconform -strict -summary -output text \
  -kubernetes-version "$KUBERNETES_VERSION" \
  -schema-location default \
  -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
  rendered/<env>.yaml
```
2. `-strict` rejects fields not in the schema (for example a misspelled `readinessprobe` or a field indented under the wrong parent). Without it such fields pass silently and are dropped by the API server.
3. Do NOT add `-ignore-missing-schemas` to get green. If it is needed temporarily, every resource it skips appears in the report as unverified.
4. For machine-readable results add `-output json` and save to `schema-<env>.json`.
5. Read the summary line: `Summary: N resources found in 1 file - Valid: V, Invalid: I, Errors: E, Skipped: S`.

| Result | Meaning | Action |
|---|---|---|
| `Invalid: I > 0` | A resource does not match its schema | Read the line above the summary (`... is invalid: problem validating schema ...`) and fix the source (chart or overlay), not the render |
| `Errors: E > 0` | Schema not found, network failure, or YAML parse error | `could not find schema for <Kind>` means add a schema source; parse errors mean broken template output |
| `Skipped: S > 0` | Resources not validated | Treat as FAIL unless each is listed with a reason |
| All zero except Valid | Pass | Record |

### Output
Raw results per environment.

### Quality Gate
- The command line in `schema_report` contains `-strict` and `-kubernetes-version` with the input value.
- The summary line is copied verbatim for each environment.

---

## Phase 3: Check Deprecated and Removed APIs and Write the Report

### Entry Criteria
- kubeconform results recorded.

### Actions
1. kubeconform validates against the given version's schemas, so an API removed in that version (for example `policy/v1beta1` PodDisruptionBudget, removed in 1.25) fails as a missing schema. Confirm by rerunning one failing file with the next lower minor version; if it passes there, the API was removed.
2. If the team plans a cluster upgrade, rerun Phase 2 with the target version and record any new failures as upgrade blockers.
3. Write `schema_report` with an overall `PASS` only when every environment has `Invalid: 0`, `Errors: 0`, `Skipped: 0`.
4. Fix failures in the chart or overlays and rerun `k8s-helm-chart-build` Phase 3 or `k8s-kustomize-overlays` Phase 3 before rerunning this flow. Never hand-edit the rendered files.

### Output
`schema_report`.

### Quality Gate
- `schema_report.overall` is `PASS`, or `FAIL` with every failing resource listed.
- No rendered file was edited (`git status --porcelain rendered/` shows only files regenerated by the render commands).

---

## Worked Example

Illustrative only. `kustomize_rendered_manifests` with staging and prod, `kubernetes_version=1.31.4`.

Phase 1 kinds: `apps/v1 Deployment`, `v1 Service`, `networking.k8s.io/v1 Ingress`, `networking.k8s.io/v1 NetworkPolicy` (4), `policy/v1 PodDisruptionBudget`, `autoscaling/v2 HorizontalPodAutoscaler`, `v1 ConfigMap`, `external-secrets.io/v1 ExternalSecret`.

Phase 2 first run:
```
rendered/prod.yaml - Deployment orders is invalid: problem validating schema. Check JSON formatting: jsonschema: '/spec/template/spec/containers/0' does not validate with https://.../deployment-apps-v1.json#/properties/spec/properties/template/properties/spec/properties/containers/items/additionalProperties: additionalProperties 'readinessprobe' not allowed
Summary: 11 resources found in 1 file - Valid: 10, Invalid: 1, Errors: 0, Skipped: 0
```
The overlay patch spelled `readinessprobe`; fixed in `overlays/prod/probes-patch.yaml`, rerendered.
```
Summary: 11 resources found in 1 file - Valid: 11, Invalid: 0, Errors: 0, Skipped: 0
```

---

## Exit Criteria

DONE when every environment validates with `-strict` against the target version, with zero invalid, error and skipped resources, or the report lists each failure.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Both or neither rendered input present | **Stop**: exactly one packaging path must have run. |
| Phase 2 | Schema download blocked | **Adjust**: mirror schemas locally and use a file `-schema-location`. |
| Phase 2 | `Invalid` resource | **Return**: to the packaging flow to fix the source, then rerun. |
| Phase 3 | API removed in target version | **Adjust**: migrate to the replacement apiVersion in the source manifests. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
