# Build Kustomize Base and Environment Overlays

**One-line description:** Moves the verified manifests into a Kustomize base and one overlay per environment that changes only the listed differences through the `images`, `replicas`, `patches` and `configMapGenerator` fields, avoids the deprecated `commonLabels` selector trap, and proves each `kustomize build` equals the verified manifests except for those differences.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `packaging_choice` (string, required): Must be `kustomize`.
- `manifest_layout` (object, required): From `k8s-helm-vs-kustomize-decision`; uses `per_env_differences`.
- `rollout_deployment` (string, required): Final Deployment from `k8s-rolling-update-pdb`.
- `pdb_manifest` (string, required): From `k8s-rolling-update-pdb`.
- `service_manifest` (string, required): From `k8s-service-ingress-manifest`.
- `ingress_manifest` (string, required): From `k8s-service-ingress-manifest`, or `none`.
- `config_manifests` (string[], required): From `k8s-configmap-secret-wiring`.
- `hpa_manifest` (string, optional): From `k8s-hpa-autoscaling`.
- `network_policies` (string[], required): From `k8s-network-policy-default-deny`.
- `namespace_manifest` (string, required): From `k8s-security-context-hardening`.
- `environments` (string[], required): Environment names.

---

## Outputs

- `kustomize_dir` (string): Path, for example `deploy/kustomize/<app>`, containing `base/` and `overlays/<env>/`.
- `kustomize_rendered_manifests` (object): Map of environment name to rendered file path (`rendered/<env>.yaml`).

---

## Phase 1: Write the Base

### Entry Criteria
- `packaging_choice` == `kustomize`.
- Record the tool version: `kustomize version`, and `kubectl version --client` (its `Kustomize Version` line). The kustomize embedded in kubectl can be older than the standalone binary; build with the same one CI and GitOps use.

### Actions
1. Copy each verified manifest into `base/` unchanged, then remove `metadata.namespace` from each (the overlay sets it).
2. Convert the static ConfigMap to a generator in `base/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
  - service.yaml
  - pdb.yaml
  - hpa.yaml
  - networkpolicy-default-deny.yaml
  - networkpolicy-allow-dns.yaml
  - networkpolicy-<app>-ingress.yaml
  - networkpolicy-<app>-egress.yaml
  - externalsecret.yaml
configMapGenerator:
  - name: <app>-config
    literals:
      - LOG_LEVEL=info
labels:
  - pairs:
      app.kubernetes.io/part-of: <system>
    includeSelectors: false
```
   The generator appends a content hash to the ConfigMap name and rewrites the Deployment's reference, so a config change rolls the pods.
3. Do NOT use `commonLabels`: it is deprecated and it adds labels to `spec.selector`, which is immutable on Deployments; changing it later forces a delete and recreate. Use `labels` with `includeSelectors: false`.
4. Keep `namespace.yaml` outside the base in `deploy/kustomize/namespaces/`; it is applied before the app, and a namespace transformer must not rename it.
5. In the base Deployment set the image to the repository name only plus the verified digest; overlays change it through `images`.

### Output
`base/` directory.

### Quality Gate
- `kustomize build base` (or `kubectl kustomize base`) exits 0.
- `grep -n "commonLabels\|patchesStrategicMerge\|patchesJson6902" -r deploy/kustomize` prints nothing.

---

## Phase 2: Write One Overlay per Environment

### Entry Criteria
- Base builds.

### Actions
1. For each environment create `overlays/<env>/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: <namespace for env>
resources:
  - ../../base
  - ingress.yaml
images:
  - name: ghcr.io/acme/<app>
    digest: sha256:<digest for env>
replicas:
  - name: <app>
    count: <n>
configMapGenerator:
  - name: <app>-config
    behavior: merge
    literals:
      - LOG_LEVEL=warn
patches:
  - path: resources-patch.yaml
    target: { kind: Deployment, name: <app> }
```
2. Map each `per_env_differences` entry to exactly one mechanism:

| Difference | Mechanism |
|---|---|
| Image tag or digest | `images` (matches by image name without tag) |
| Replica count | `replicas` (remove when an HPA owns the count) |
| ConfigMap value | `configMapGenerator` with `behavior: merge` |
| Hostname, resources, other fields | `patches` with a strategic merge file or an inline JSON 6902 `op: replace` patch |
| Object only in one environment | List its file under that overlay's `resources` |

3. Use only `patches` (the current field). Run `kustomize edit fix` in a directory that has old fields to convert them.
4. Do not copy a whole Deployment into an overlay to change one field; patch the field.

### Output
Overlay directories.

### Quality Gate
- `kustomize build overlays/<env>` exits 0 for every environment.
- Every `per_env_differences` entry maps to one table row in the notes.

---

## Phase 3: Render and Compare

### Entry Criteria
- All overlays build.

### Actions
1. `kustomize build overlays/<env> > rendered/<env>.yaml` for every environment.
2. Compare the render of the environment where the raw manifests were verified against those raw manifests: `dyff between raw-all.yaml rendered/<env>.yaml`, or `yq -P 'sort_keys(..)'` on both and `diff`. Allowed differences: the ConfigMap hash suffix and its reference, and the `labels` pairs. Any other difference is an overlay bug.
3. `diff rendered/<env1>.yaml rendered/<env2>.yaml` must show only `per_env_differences` fields and hash suffixes.
4. Confirm the selector did not change: `yq 'select(.kind=="Deployment") | .spec.selector' rendered/<env>.yaml` equals the selector in `rollout_deployment`.

### Output
`kustomize_dir`, `kustomize_rendered_manifests`.

### Quality Gate
- Raw-versus-render comparison lists only allowed differences.
- The selector check prints the same two labels as the verified Deployment.

---

## Worked Example

Illustrative only. `orders`, environments `staging` and `prod`; differences: image digest, replicas, host, `LOG_LEVEL`.

Phase 1:
```
$ kubectl version --client
Client Version: v1.31.4
Kustomize Version: v5.4.2
$ kubectl kustomize deploy/kustomize/orders/base | grep -c '^kind:'
9
```

Phase 3:
```
$ diff rendered/staging.yaml rendered/prod.yaml
<   LOG_LEVEL: info
>   LOG_LEVEL: warn
<   name: orders-config-7g2b9m4kc8
>   name: orders-config-tf5h6dc9k2
<       host: orders.staging.example.com
>       host: orders.example.com
```
Only listed differences and hash suffixes appear.

---

## Exit Criteria

DONE when the base and every overlay build, overlays change only listed fields through the mapped mechanisms, and renders match the verified manifests except allowed differences.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `packaging_choice` is not `kustomize` | **Stop**: this step is skipped by the chain condition. |
| Phase 2 | `images` entry has no effect | **Adjust**: the `name` must equal the base image name exactly, without tag or digest. |
| Phase 2 | `merge` generator error `behavior must be merge or replace` or name not found | **Adjust**: the base must declare a generator with the same name. |
| Phase 3 | Selector differs from the verified Deployment | **Stop**: remove the label source that touched the selector before anything is applied. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
