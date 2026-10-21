# ConfigMap and Secret Wiring

**One-line description:** Moves every environment variable from `workload_profile` into a ConfigMap or a Secret delivered by a chosen backend (External Secrets Operator, Sealed Secrets, or SOPS), wires them into the Deployment, and makes a config change trigger a rollout with a hash suffix or checksum annotation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workload_profile` (object, required): Output of `k8s-workload-inventory`; `env_vars` lists names and the secret flag.
- `deployment_manifest` (string, required): Path from `k8s-deployment-manifest`.
- `secret_backend` (string, required): One of `external-secrets`, `sealed-secrets`, `sops`, `manual`. `manual` means a human or pipeline creates the Secret out of band.
- `packaging_choice` (string, required): `helm` or `kustomize`; decides how a config change triggers a rollout.

---

## Outputs

- `config_manifests` (string[]): Paths to the ConfigMap file and the secret source file (ExternalSecret, SealedSecret, or SOPS-encrypted Secret).
- `wired_deployment` (string): Path to the Deployment with `env`/`envFrom` and volume mounts added.

---

## Phase 1: Split Variables into ConfigMap and Secret

### Entry Criteria
- `workload_profile.env_vars` exists (may be empty; then write empty outputs and stop).

### Actions
1. Put each variable with `secret: no` in ConfigMap `<app_name>-config`. Put each `secret: yes` variable in Secret `<app_name>-secrets`.
2. Decide delivery per variable:

| Variable kind | Delivery | Why |
|---|---|---|
| Plain setting read once at start | `envFrom.configMapRef` | Simple |
| Secret value read once at start | `env[].valueFrom.secretKeyRef` (one per key) | Only listed keys enter the environment |
| File the app reads (TLS key, JSON credentials, config file) | `volumes[].secret` or `volumes[].configMap` mounted read-only | Files never appear in `env` dumps |
| Value the app must see change without restart | Volume mount, no `subPath` | Mounted ConfigMap/Secret volumes are updated by the kubelet eventually; environment variables never update in a running container; `subPath` mounts never update |

3. Do NOT use `envFrom.secretRef` for the whole Secret unless every key is needed; it exposes every key to the process environment.
4. Check sizes: a ConfigMap or Secret is limited to 1 MiB of data. If a value exceeds that, record an open question (object storage or a volume instead).

### Output
Variable-to-object table.

### Quality Gate
- Every `env_vars` entry appears in exactly one row of the table.
- No secret-flagged variable is in the ConfigMap.

---

## Phase 2: Write the Secret Source for the Chosen Backend

### Entry Criteria
- Variable table complete.

### Actions
1. Never commit a plain `kind: Secret` with `data:` or `stringData:` values to git. Base64 is encoding, not encryption.
2. Follow the row for `secret_backend`:

| `secret_backend` | File to write | Commands to prove it |
|---|---|---|
| `external-secrets` | `externalsecret.yaml` with `kind: ExternalSecret`, `spec.secretStoreRef` (name and kind `SecretStore` or `ClusterSecretStore`), `spec.target.name: <app_name>-secrets`, one `spec.data[]` entry per key with `remoteRef.key` | `kubectl api-resources | grep -i externalsecret` to read the served apiVersion (use exactly that version); after apply `kubectl get externalsecret -n NS` shows `STATUS SecretSynced` and `READY True` |
| `sealed-secrets` | `sealedsecret.yaml` from `kubectl create secret generic <app_name>-secrets -n NS --from-literal=KEY=VALUE --dry-run=client -o yaml | kubeseal --format yaml > sealedsecret.yaml` | `kubeseal --validate < sealedsecret.yaml` exits 0; the namespace and name are bound into the encryption (strict scope by default), so renaming later requires resealing |
| `sops` | `secret.enc.yaml` from `sops --encrypt --encrypted-regex '^(data|stringData)$' secret.yaml > secret.enc.yaml` with keys from `.sops.yaml` (age or a cloud KMS) | `grep -c 'ENC\[' secret.enc.yaml` is at least the key count; Flux decrypts natively with `spec.decryption.provider: sops`; Argo CD needs a plugin such as KSOPS, record that |
| `manual` | No secret file in git; write `secret-keys.txt` listing required key names only | `kubectl get secret <app_name>-secrets -n NS -o jsonpath='{.data}' | jq 'keys'` lists every key |

3. Delete the temporary plaintext `secret.yaml` after encrypting with `shred -u secret.yaml` (or `rm` where shred is unavailable) and confirm `git status --porcelain | grep secret.yaml` prints nothing for the plaintext file.
4. Write the ConfigMap. With `packaging_choice` == `kustomize`, write a `configMapGenerator` entry in the planned `kustomization.yaml` notes instead of a static ConfigMap (the generator adds a content hash suffix to the name). With `helm`, write a static `configmap.yaml`.

### Output
`config_manifests`.

### Quality Gate
- `git diff --cached --name-only | xargs grep -lE '^kind: Secret$' 2>/dev/null` returns no file containing plaintext `data:`/`stringData:` values.
- The backend proof command in the table ran and its output is recorded.

---

## Phase 3: Wire into the Deployment and Trigger Rollouts

### Entry Criteria
- `config_manifests` written.

### Actions
1. Copy `deployment.yaml` and add under the container: `envFrom: [{configMapRef: {name: <app_name>-config}}]` and one `env` entry per secret key with `valueFrom.secretKeyRef` (`name: <app_name>-secrets`, `key: KEY`). Save as the same path; `wired_deployment` points to it.
2. Make config changes restart pods (environment variables are read only at container start):

| `packaging_choice` | Mechanism |
|---|---|
| `kustomize` | `configMapGenerator` and `secretGenerator` append a hash suffix and rewrite references, so a content change changes the pod template |
| `helm` | Add to `spec.template.metadata.annotations`: `checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}` |

3. For an ExternalSecret or SealedSecret the Secret content changes outside the template. Record the open question: restart with `kubectl rollout restart deployment/<app_name>` after rotation, or install a reloader controller; do not claim automatic restart.
4. If a key is optional for the app, set `optional: true` on that `secretKeyRef`; otherwise a missing key keeps the pod in `CreateContainerConfigError`.
5. Run `kubectl apply --dry-run=server -f wired deployment`.

### Output
`wired_deployment`.

### Quality Gate
- `yq '.spec.template.spec.containers[0].env[].valueFrom.secretKeyRef.key' deployment.yaml` lists every secret key.
- The server dry run prints `(server dry run)`.

---

## Worked Example

Illustrative only. `orders`, `secret_backend=external-secrets`, `packaging_choice=kustomize`. Variables: `LOG_LEVEL`, `ALLOWED_HOSTS` (config), `DATABASE_URL` (secret).

Phase 1 table: `LOG_LEVEL`, `ALLOWED_HOSTS` to `envFrom.configMapRef`; `DATABASE_URL` to `secretKeyRef`.

Phase 2:
```
$ kubectl api-resources | grep -i externalsecret
externalsecrets   es   external-secrets.io/v1   true   ExternalSecret
```
`externalsecret.yaml` uses `apiVersion: external-secrets.io/v1`, store `ClusterSecretStore/vault`, `remoteRef.key: shop/orders`, property `database_url`.

Phase 3: generator `orders-config` gets a hash suffix; after apply in staging:
```
$ kubectl get externalsecret -n shop
NAME     STORE   REFRESH INTERVAL   STATUS         READY
orders   vault   1h                 SecretSynced   True
```

---

## Exit Criteria

DONE when every variable is delivered by a ConfigMap or a backend-managed Secret, no plaintext secret is in git, and a config change alters the pod template.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A variable mixes secret and non-secret content (a URL with an embedded password) | **Adjust**: treat the whole value as secret. |
| Phase 2 | Backend CRD not installed (`kubectl api-resources` shows nothing) | **Stop**: report; installing a secrets operator is a platform decision. |
| Phase 2 | ExternalSecret `SecretSyncedError` | **Adjust**: `kubectl describe externalsecret NAME -n NS`; fix the remote key or store permissions. |
| Phase 3 | Pod in `CreateContainerConfigError` | **Return**: to `k8s-pod-debug-triage`; usually a missing key or Secret name. |
| Phase 3 | Plaintext secret already committed | **Stop**: rotate the credential first; removing it from history does not revoke it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
