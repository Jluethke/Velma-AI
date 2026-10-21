# Choose A Secret Store

**One-line description:** Picks exactly one secret store for a service (HashiCorp Vault or OpenBao, AWS Secrets Manager, AWS SSM Parameter Store SecureString, or SOPS-encrypted files in git) with an ordered decision table driven by cloud, runtime platform, need for dynamic or auto-rotated credentials, and operating capacity, and writes the secret naming scheme every later flow uses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `config_keys` (object[], required): Classified keys from `cfg-twelve-factor-audit`; the `secret` rows are placed in the store.
- `cloud_provider` (string, required): `aws`, `gcp`, `azure`, `on-prem`, or `multi`.
- `platform` (string, required): Where the service runs: `kubernetes`, `ecs`, `lambda`, `vm`, `paas`.

---

## Outputs

- `secret_store` (string): One of `vault`, `aws-secrets-manager`, `aws-ssm`, `sops`, `gcp-secret-manager`, `azure-key-vault`.
- `store_decision` (object): The rule that selected the store, rejected options with reasons, the naming scheme (path template), the delivery mechanism per platform, and open questions.

---

## Phase 1: Collect Facts

### Entry Criteria
- `config_keys` has at least one `class: secret` row.

### Actions
1. Answer each question with evidence. If the answer is unknown, ask the user; do not assume.

| Fact | How to find it |
|---|---|
| A store is already in use | `rg -n -e 'hvac' -e 'vault' -e 'secretsmanager' -e 'GetSecretValue' -e 'ssm:GetParameter' -e 'sops' -e 'ExternalSecret' -e 'SecretProviderClass'` in the repo and its deploy repo |
| Organization already runs Vault or OpenBao | Ask the platform team; `vault status` against the known address prints `Sealed false` |
| Dynamic database credentials or auto-rotation needed | `config_keys` contains database passwords and the user wants per-pod short-lived users or scheduled rotation |
| GitOps with no runtime store reachable | Deploys are Argo CD or Flux from git only, or the service runs where no store is reachable |
| Number of secrets and environments | Count `secret` rows times environments |

2. Record each fact and its evidence in `store_decision.facts`.

### Output
Fact sheet.

### Quality Gate
- Every fact row has a value and evidence (a command output or the name of the person who answered).

---

## Phase 2: Apply The Decision Table

### Entry Criteria
- Fact sheet complete.

### Actions
1. Apply rules in order; first match wins.

| Order | Condition | `secret_store` |
|---|---|---|
| 1 | A store is already in use and meets the needs below | that store (do not add a second one) |
| 2 | Dynamic database credentials or PKI issuance needed, any cloud | `vault` (database and PKI secrets engines) |
| 3 | `cloud_provider == multi` or `on-prem`, and Vault/OpenBao is already operated | `vault` |
| 4 | `cloud_provider == aws`, managed rotation needed (for example RDS master password via `--manage-master-user-password`, or a rotation Lambda) | `aws-secrets-manager` |
| 5 | `cloud_provider == aws`, small number of static secrets, no rotation needed, cost sensitive | `aws-ssm` (SecureString parameters) |
| 6 | `cloud_provider == aws`, otherwise | `aws-secrets-manager` |
| 7 | `cloud_provider == gcp` | `gcp-secret-manager` |
| 8 | `cloud_provider == azure` | `azure-key-vault` |
| 9 | GitOps-only, or no runtime store reachable, or `on-prem` without Vault | `sops` (age or cloud KMS recipients) |

2. Write the rejected options and the rule that excluded each.
3. Note operating cost honestly: self-hosted Vault needs unseal handling, backups, upgrades and HA; that is why rule 3 requires that it already be operated. Do not pick self-hosted Vault for one service with five static secrets.
4. This marketplace has integration flows for `vault`, `aws-secrets-manager` and `sops`. If the result is `aws-ssm`, `gcp-secret-manager` or `azure-key-vault`, record in open questions that the integration follows the provider's docs, and the same delivery rules in Phase 3 apply.

### Output
`secret_store` with the matching rule number.

### Quality Gate
- `store_decision.rule` names exactly one rule number and the facts that satisfied it.

---

## Phase 3: Fix Naming And Delivery

### Entry Criteria
- Store chosen.

### Actions
1. Use one path template: `<env>/<service>/<name>`, for example `prod/billing/stripe`. Store forms:

| Store | Concrete name |
|---|---|
| vault (KV v2 mounted at `secret`) | `secret/prod/billing/stripe` (API path `secret/data/prod/billing/stripe`) |
| aws-secrets-manager | `prod/billing/stripe` |
| aws-ssm | `/prod/billing/stripe` (parameter names starting with `/` form a hierarchy for `get-parameters-by-path`) |
| sops | file `secrets/prod/billing.enc.yaml`, key `stripe` |

2. One secret per credential, or one JSON object per tightly coupled group (database host, user, password). Never one giant blob per environment: access policies then cannot be scoped per service.
3. Pick the delivery mechanism by platform:

| `platform` | Delivery |
|---|---|
| kubernetes | External Secrets Operator syncing into a Kubernetes Secret, or the Secrets Store CSI Driver mounting files; see `cfg-k8s-secret-injection` |
| ecs | Task definition `secrets` with `valueFrom` (Secrets Manager or SSM ARN); the execution role needs read access |
| lambda | Fetch at cold start with a caching client, or the AWS Parameters and Secrets Lambda Extension |
| vm | Vault Agent templating to a file, or a fetch at start with the SDK |
| paas | The platform's secret settings, populated from the store by CI |

4. Record environments as separate paths with separate access policies; a staging identity must not read `prod/`.

### Output
`secret_store`, `store_decision`.

### Quality Gate
- Every `secret` row in `config_keys` has a concrete store name following the template.
- Each environment's paths are disjoint (no path shared between `prod` and another environment).

---

## Common Mistakes To Avoid

- Do not choose a store by popularity. Use the table.
- Do not run two stores for the same service.
- Do not treat Kubernetes Secrets as the store; they are a delivery mechanism and by default are only base64-encoded in etcd.
- Do not name secrets with the environment as a suffix in one shared path (`billing/stripe_prod`); access policies cannot separate them cleanly.

---

## Worked Example

Illustrative. `cloud_provider=aws`, `platform=kubernetes` (EKS), 4 secrets in 2 environments, no existing store, RDS PostgreSQL in use.

Phase 1: `rg secretsmanager` returns nothing; no Vault in the organization; RDS master password should rotate.

Phase 2: rule 4 matches, `secret_store=aws-secrets-manager`. Rejected: `vault` (rule 2 not needed, rule 3 not operated), `aws-ssm` (rotation needed), `sops` (runtime store reachable).

Phase 3:
```
prod/billing/db       {"host":...,"username":...,"password":...}
prod/billing/stripe
staging/billing/db
staging/billing/stripe
delivery: External Secrets Operator ClusterSecretStore per environment, IRSA role per namespace
```

---

## Exit Criteria

DONE when one store is chosen by a numbered rule with evidence, every secret has a concrete name in that store, and the delivery mechanism for the platform is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Facts unknown and user unavailable | **Return**: list the open questions; do not pick a store on guesses. |
| Phase 2 | Two stores already in use | **Adjust**: pick the one covering more secrets and record migrating the other as follow-up. |
| Phase 3 | Existing names do not follow the template | **Adjust**: keep existing names if renaming breaks consumers; record the mapping. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
