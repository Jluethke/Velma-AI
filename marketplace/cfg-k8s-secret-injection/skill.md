# Kubernetes Secret Injection

**One-line description:** Delivers secrets from the chosen store into Kubernetes pods without committing Secret manifests, using External Secrets Operator (or the Secrets Store CSI Driver) to sync, file mounts in preference to environment variables, RBAC that keeps other service accounts from reading the Secret, and checks for etcd encryption at rest, then proves the pod sees the value and other identities cannot.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `config_keys` (object[], required): Classified keys; `secret` rows are delivered.
- `secret_store` (string, required): Output of `cfg-choose-secret-store`.
- `repo_path` (string, required): Absolute path to the repository holding the Kubernetes manifests or Helm chart.

---

## Outputs

- `k8s_manifests` (object): Paths of manifests added or changed (SecretStore, ExternalSecret, Deployment patch, Role/RoleBinding), the delivery mode per key (file or env), and the verification outputs.

---

## Phase 1: Choose Sync Mechanism And Check The Cluster

### Entry Criteria
- `kubectl config current-context` names the intended cluster; `kubectl auth can-i create externalsecrets.external-secrets.io -n <ns>` or the equivalent for your role prints `yes`.

### Actions
1. Choose the mechanism:

| `secret_store` | Mechanism |
|---|---|
| aws-secrets-manager, aws-ssm, gcp-secret-manager, azure-key-vault, vault | External Secrets Operator (ESO): `SecretStore`/`ClusterSecretStore` + `ExternalSecret`, creating a normal Kubernetes Secret. Or the Secrets Store CSI Driver with the provider plugin when the policy forbids secrets in etcd (CSI mounts files directly; syncing to a Secret is optional) |
| vault | Also possible: Vault Agent Injector (see `cfg-vault-kv-integration`) |
| sops | Flux kustomize-controller with `decryption.provider: sops`, or the helm-secrets plugin in the deploy pipeline. The encrypted file is in git; decryption happens in-cluster or in CI |

2. Confirm the operator is installed: `kubectl get crd externalsecrets.external-secrets.io` (ESO) or `kubectl get csidrivers secrets-store.csi.k8s.io` (CSI). Check the API version your installed CRD serves with `kubectl api-resources | rg -i externalsecret`; use that version in manifests.
3. Check encryption at rest for Secret objects in etcd:
   - Managed clusters: EKS envelope encryption with KMS (`aws eks describe-cluster --name <c> --query 'cluster.encryptionConfig'` returns a non-empty list); GKE application-layer secrets encryption (`gcloud container clusters describe <c> --format='value(databaseEncryption.state)'` prints `ENCRYPTED`); AKS uses KMS etcd encryption when enabled (check `az aks show` output for `securityProfile.azureKeyVaultKms`).
   - Self-managed: the API server runs with `--encryption-provider-config` pointing to an `EncryptionConfiguration` whose first provider for `secrets` is not `identity`.
   Base64 in a Secret is encoding, not encryption. Record the result; if not encrypted, record it as an open risk for the cluster owner.

### Output
Mechanism and cluster facts.

### Quality Gate
- The CRD or CSI driver check prints the resource.
- Encryption at rest status is recorded with the command output.

---

## Phase 2: Write The Manifests

### Entry Criteria
- Phase 1 complete.

### Actions
1. ESO example for AWS Secrets Manager with IRSA (adapt `provider` for others per ESO docs):
```yaml
apiVersion: external-secrets.io/v1beta1   # use the version your CRD serves
kind: SecretStore
metadata: { name: aws-sm, namespace: prod }
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef: { name: billing-eso }
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata: { name: billing, namespace: prod }
spec:
  refreshInterval: <user-chosen interval>
  secretStoreRef: { name: aws-sm, kind: SecretStore }
  target: { name: billing-secrets, creationPolicy: Owner }
  data:
    - secretKey: stripe_api_key
      remoteRef: { key: prod/billing/stripe, property: api_key }
```
   Prefer a namespaced `SecretStore` per namespace over one `ClusterSecretStore` with broad cloud permissions.
2. Consume as files by default:
```yaml
volumes:
  - name: secrets
    secret: { secretName: billing-secrets, defaultMode: 0400 }
containers:
  - name: app
    volumeMounts:
      - { name: secrets, mountPath: /run/secrets, readOnly: true }
```
   Decision rule for file versus env:

| Condition | Mode |
|---|---|
| App can read files (pydantic `secrets_dir`, Spring `configtree:`, Go `,file`, Node `fs.readFileSync`) | file mount |
| App only reads env vars and cannot change now | `env[].valueFrom.secretKeyRef` for named keys (not `envFrom` for the whole Secret) |

   Reasons: env vars are inherited by child processes, appear in crash dumps and `kubectl describe` of some tooling, and never update in a running pod; mounted Secret files update in place (except `subPath` mounts, which never update).
3. Set `automountServiceAccountToken: false` on the pod spec unless the app calls the Kubernetes API.
4. RBAC: the app's service account needs no `get secrets` permission to receive mounted Secrets (kubelet mounts them). Do not grant `get`/`list` on `secrets` to the app. If something must read a Secret through the API, use a Role with `resourceNames: ["billing-secrets"]` and verbs `["get"]` only.
5. Never commit a rendered Secret. If you used `kubectl create secret generic ... --dry-run=client -o yaml` for testing, delete the output file. Add `*.secret.yaml` style patterns used locally to `.gitignore`.

### Output
Manifests in `repo_path`.

### Quality Gate
- `kubectl apply --dry-run=server -f <manifests>` exits 0.
- `rg -n '^kind: Secret$' <manifest dir>` returns nothing (no committed Secret objects; SOPS-encrypted ones with a `sops:` block are the only exception).

---

## Phase 3: Apply And Verify

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Apply through the normal deploy path (GitOps commit, `helm upgrade`, or `kubectl apply`).
2. Check sync: `kubectl get externalsecret billing -n prod` shows `STATUS SecretSynced` and `READY True`. If not, `kubectl describe externalsecret billing -n prod` shows the provider error in Events.
3. Check the pod sees the file without printing it: `kubectl exec deploy/billing -n prod -c app -- sh -c 'test -s /run/secrets/stripe_api_key && echo present'` prints `present`.
4. Check other identities cannot read it:
   - `kubectl auth can-i get secret/billing-secrets -n prod --as=system:serviceaccount:prod:billing` prints `no` (the app does not need API access).
   - `kubectl auth can-i get secrets -n prod --as=system:serviceaccount:prod:default` prints `no`.
5. Check the app's startup validation passed: `kubectl logs deploy/billing -n prod -c app | rg 'config error'` returns nothing and the rollout succeeded (`kubectl rollout status deploy/billing -n prod`).

### Output
`k8s_manifests`.

### Quality Gate
- ExternalSecret shows `SecretSynced` (or the CSI/Flux equivalent shows success).
- Both `can-i` checks print `no`.
- `kubectl rollout status` prints `successfully rolled out`.

---

## Common Mistakes To Avoid

- Do not commit Secret YAML with base64 values; base64 decodes with one command.
- Do not use `envFrom: secretRef` for a whole Secret; every key becomes an env var, including ones the app should not see.
- Do not use `subPath` for secret files that rotate.
- Do not print secrets with `kubectl get secret -o yaml` in shared terminals or CI logs.

---

## Worked Example

Illustrative. EKS with KMS envelope encryption, ESO installed, `secret_store=aws-secrets-manager`.

```
$ aws eks describe-cluster --name prod --query 'cluster.encryptionConfig[0].resources'
["secrets"]
$ kubectl get externalsecret billing -n prod
NAME      STORE    REFRESH INTERVAL   STATUS         READY
billing   aws-sm   1h                 SecretSynced   True
$ kubectl exec deploy/billing -n prod -c app -- sh -c 'test -s /run/secrets/stripe_api_key && echo present'
present
$ kubectl auth can-i get secret/billing-secrets -n prod --as=system:serviceaccount:prod:billing
no
```
(`1h` was the user's chosen refresh interval.)

---

## Exit Criteria

DONE when secrets sync from the store into the pod as files (or named env vars by rule), no Secret objects are committed, the app service account cannot read Secrets through the API, encryption at rest status is recorded, and the rollout succeeded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | ESO not installed and no permission to install | **Return**: ask the cluster owner; meanwhile, use the platform's documented alternative (CSI driver or Agent Injector) if installed. |
| Phase 3 | `SecretSyncedError` with `AccessDenied` | **Retry**: fix the IRSA role trust and the store policy from the secret manager flow. |
| Phase 3 | Pod crash-loops with `config error` | **Adjust**: the file name or env var name does not match the app's schema; align `secretKey` names. |
| Phase 3 | `can-i` prints `yes` for the default service account | **Stop**: a broad RoleBinding exists; find it with `kubectl get rolebindings,clusterrolebindings -A -o wide | rg default` and remove the grant with its owner. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
