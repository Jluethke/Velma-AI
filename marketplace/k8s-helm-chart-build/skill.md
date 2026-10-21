# Build a Helm Chart from Verified Manifests

**One-line description:** Turns the verified plain manifests into a Helm chart that templates ONLY the fields that differ per environment, adds a `values.schema.json` so bad values fail at lint time, renders every environment with `helm template`, and proves each render equals the verified manifests except for the intended differences.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `packaging_choice` (string, required): Must be `helm`.
- `manifest_layout` (object, required): From `k8s-helm-vs-kustomize-decision`; uses `per_env_differences` and planned `files`.
- `rollout_deployment` (string, required): Final Deployment from `k8s-rolling-update-pdb`.
- `pdb_manifest` (string, required): From `k8s-rolling-update-pdb`.
- `service_manifest` (string, required): From `k8s-service-ingress-manifest`.
- `ingress_manifest` (string, required): From `k8s-service-ingress-manifest`, or `none`.
- `config_manifests` (string[], required): From `k8s-configmap-secret-wiring`.
- `hpa_manifest` (string, optional): From `k8s-hpa-autoscaling`, absent when no HPA.
- `network_policies` (string[], required): From `k8s-network-policy-default-deny`.
- `namespace_manifest` (string, required): From `k8s-security-context-hardening`; kept OUTSIDE the chart.
- `environments` (string[], required): Environment names.

---

## Outputs

- `chart_dir` (string): Path to the chart, for example `deploy/helm/<app>`.
- `helm_rendered_manifests` (object): Map of environment name to rendered file path (`rendered/<env>.yaml`).

---

## Phase 1: Create the Chart Skeleton

### Entry Criteria
- `packaging_choice` == `helm`. `helm version` prints `v3.x` or `v4.x`; record it.

### Actions
1. Do NOT run `helm create` and keep its boilerplate (ServiceAccount, test pod, sample values) unless the app needs them; unused templates become unreviewed objects. Create files by hand:
   - `Chart.yaml`:
```yaml
apiVersion: v2
name: <app>
description: <one sentence>
type: application
version: 0.1.0
appVersion: "<image tag>"
```
   - `templates/_helpers.tpl` with `define` blocks for `<app>.fullname`, `<app>.labels` (the recommended labels plus `helm.sh/chart`) and `<app>.selectorLabels` (only `app.kubernetes.io/name` and `app.kubernetes.io/instance: {{ .Release.Name }}`).
2. Copy each verified manifest into `templates/` unchanged, one object per file. Remove `metadata.namespace` from every template: the namespace comes from `helm install -n` (`.Release.Namespace`).
3. Keep `namespace.yaml` out of the chart. Namespaces with Pod Security labels are created before the release (by the platform, by GitOps `CreateNamespace`, or `kubectl apply -f namespace.yaml`). A chart that owns its namespace deletes it on `helm uninstall`.

### Output
Skeleton with untemplated copies.

### Quality Gate
- `helm lint <chart_dir>` exits 0 (warnings recorded).
- `grep -rn "namespace:" <chart_dir>/templates | grep -v Release.Namespace` prints nothing.

---

## Phase 2: Template Only the Differences

### Entry Criteria
- Skeleton lints.

### Actions
1. For each entry in `manifest_layout.per_env_differences`, replace the literal with a value reference and add the key to `values.yaml` with the current verified value as default:
   - Image: `image: "{{ .Values.image.repository }}@{{ .Values.image.digest }}"`.
   - Replicas: `{{- if not .Values.autoscaling.enabled }}` around `replicas: {{ .Values.replicaCount }}`.
   - Host: `host: {{ .Values.ingress.host | quote }}`.
   - Optional objects (Ingress, HPA): wrap the whole file in `{{- if .Values.ingress.enabled }} ... {{- end }}`.
2. Replace labels and selectors with `{{- include "<app>.labels" . | nindent 4 }}` and `{{- include "<app>.selectorLabels" . | nindent 6 }}`, matching each indentation level. Wrong `nindent` is the most common Helm bug; it renders but places keys under the wrong parent.
3. Add the config checksum annotation to the pod template: `checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}`.
4. Do NOT template fields that are the same in every environment (probes, securityContext, resources unless they differ). Every extra value is an untested input.
5. Write `values-<env>.yaml` per environment with ONLY that environment's differing values.
6. Write `values.schema.json` (JSON Schema) covering every key in `values.yaml`, with `required` for `image.repository` and `image.digest` and `"pattern": "^sha256:[0-9a-f]{64}$"` for the digest. Helm validates values against it on `lint`, `template`, `install` and `upgrade`.

### Output
Templated chart with per-environment values files.

### Quality Gate
- `helm lint <chart_dir> --strict -f values-<env>.yaml` exits 0 for every environment.
- `helm template x <chart_dir> --set image.digest=bad` fails with a schema error (proves the schema is active).

---

## Phase 3: Render and Compare

### Entry Criteria
- Lint passes for all environments.

### Actions
1. Render each environment: `helm template <app> <chart_dir> -n <namespace> -f <chart_dir>/values-<env>.yaml > rendered/<env>.yaml`.
2. Compare the render for the environment the raw manifests were verified in with those raw manifests. Use `dyff between raw-all.yaml rendered/<env>.yaml` if `dyff` is installed, or normalize both with `yq -P 'sort_keys(..)'` and `diff`. Allowed differences: `helm.sh/chart` and `app.kubernetes.io/managed-by` labels, the instance label value, and the checksum annotation. Any other difference is a templating bug.
3. Compare environments with each other: `diff rendered/staging.yaml rendered/prod.yaml` must show only fields listed in `per_env_differences`.
4. Optional unit tests: if the team uses the `helm-unittest` plugin (`helm plugin list` shows `unittest`), add tests asserting the Ingress is absent when `ingress.enabled=false`, and run `helm unittest <chart_dir>`.
5. Package for GitOps or registries when required: `helm package <chart_dir>` then `helm push <app>-<version>.tgz oci://<registry>/charts`. Bump `version` in `Chart.yaml` on every chart change; registries and Argo CD cache by version.
6. Helm 4 renamed some install and upgrade flags (for example `--atomic`). Before writing CI commands, read `helm upgrade --help` for the installed major version instead of copying flags from older examples.

### Output
`chart_dir`, `helm_rendered_manifests`.

### Quality Gate
- The raw-versus-render comparison lists only the allowed differences.
- The environment-to-environment diff lists only `per_env_differences` fields.

---

## Worked Example

Illustrative only. `billing`, environments `staging` and `prod`; differences: replicas, image digest, ingress host.

Phase 2 deployment excerpt:
```yaml
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "billing.selectorLabels" . | nindent 6 }}
```

Phase 3:
```
$ helm lint deploy/helm/billing --strict -f deploy/helm/billing/values-prod.yaml
==> Linting deploy/helm/billing
1 chart(s) linted, 0 chart(s) failed
$ helm template x deploy/helm/billing --set image.digest=bad
Error: values don't meet the specifications of the schema(s) in the following chart(s):
billing:
- image.digest: Does not match pattern '^sha256:[0-9a-f]{64}$'
$ diff rendered/staging.yaml rendered/prod.yaml
<       host: billing.staging.example.com
>       host: billing.example.com
```

---

## Exit Criteria

DONE when the chart lints strictly for every environment, the schema rejects a bad digest, and every render matches the verified manifests except for the listed differences.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `packaging_choice` is not `helm` | **Stop**: this step is skipped by the chain condition. |
| Phase 2 | `error converting YAML to JSON` on lint | **Adjust**: fix `nindent` or quoting at the reported template line; render with `--debug` to see the output. |
| Phase 3 | Render differs from raw in an unlisted field | **Adjust**: the template changed a verified value; restore it. Do not update the raw manifest to match. |
| Phase 3 | `helm push` unauthorized | **Adjust**: `helm registry login <registry>` and retry. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
