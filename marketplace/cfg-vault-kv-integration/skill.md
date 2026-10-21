# Vault KV v2 Integration

**One-line description:** Stores a service's secrets in a HashiCorp Vault (or OpenBao) KV version 2 engine, writes a read-only policy using the `data/` and `metadata/` API paths that KV v2 requires, binds it to the workload through Kubernetes or AppRole auth with short token TTLs, delivers values with Vault Agent templates, and proves the identity can read its own path and nothing else.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `config_keys` (object[], required): Classified keys; `secret` rows are written to Vault.
- `store_decision` (object, required): Output of `cfg-choose-secret-store` with the path template.
- `repo_path` (string, required): Absolute path to the service repository (Agent config and manifests go here).

---

## Outputs

- `secret_store_config` (object): Vault address, KV mount, secret paths, auth method and role, Agent template files added, and the read check output.
- `secret_access_policy` (string): Path of the HCL policy file and the result of `vault token capabilities` checks.

---

## Phase 1: Prepare The Mount And Write Secrets

### Entry Criteria
- `vault status` against `VAULT_ADDR` prints `Sealed false`.
- You are authenticated with a token that can manage mounts and policies (`vault token lookup` shows the policies). Use your own login (`vault login -method=oidc` or similar), not a root token.

### Actions
1. Check the mount: `vault secrets list -format=json | jq 'to_entries[] | select(.key=="secret/") | .value.options.version'`. It must print `"2"`. If the mount is missing, `vault secrets enable -path=secret kv-v2`. If it is version 1, stop and ask the platform team; do not upgrade a shared mount yourself (`vault kv enable-versioning` changes behavior for every user).
2. Write each secret without putting the value on the command line (shell history and `ps` would show it):
   - From a file: `vault kv put -mount=secret prod/billing/stripe api_key=@/dev/stdin` reading from a pipe, or `vault kv put -mount=secret prod/billing/db @db.json` where `db.json` is a JSON object; delete the file afterward.
   - Interactive: `vault kv put -mount=secret prod/billing/stripe api_key=-` reads the value from stdin.
   Check the `@` and `-` forms in `vault kv put -h` for your version.
3. Read back metadata only: `vault kv metadata get -mount=secret prod/billing/stripe` shows `current_version`. Do not `vault kv get` with the value printed in a shared terminal; use `-field=api_key` piped into a length check if you need proof: `vault kv get -mount=secret -field=api_key prod/billing/stripe | wc -c`.
4. Optionally set `vault kv metadata put -mount=secret -max-versions=<n> prod/billing/stripe` to bound retained versions; `<n>` is a user decision, there is no right default.

### Output
Secrets written under `secret/<env>/<service>/...`.

### Quality Gate
- `vault kv metadata get` prints a `current_version` of at least 1 for every secret path.
- No secret value appears in your shell history: `history | rg -i 'kv put' ` shows only `@file`, `@/dev/stdin` or `-` forms.

---

## Phase 2: Policy And Auth Binding

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Write `deploy/vault/billing-prod.hcl` in `repo_path`:
```hcl
path "secret/data/prod/billing/*" {
  capabilities = ["read"]
}
path "secret/metadata/prod/billing/*" {
  capabilities = ["list"]
}
```
   KV v2 API paths insert `data/` (for values) and `metadata/` (for listing and versions) after the mount. A policy written as `path "secret/prod/billing/*"` matches nothing in KV v2. This is the most common Vault policy bug. Omit the `metadata` block if the service never lists keys.
2. Load it: `vault policy write billing-prod deploy/vault/billing-prod.hcl`.
3. Bind it to the workload identity:

| Runtime | Commands |
|---|---|
| Kubernetes | `vault write auth/kubernetes/role/billing-prod bound_service_account_names=billing bound_service_account_namespaces=prod token_policies=billing-prod token_ttl=<ttl> token_max_ttl=<max>` (the `kubernetes` auth method must be enabled and configured with the cluster's API address; check `vault auth list`) |
| VM or CI without OIDC | `vault write auth/approle/role/billing-prod token_policies=billing-prod token_ttl=<ttl> token_max_ttl=<max> secret_id_ttl=<ttl> secret_id_num_uses=<n>`; read `role-id` with `vault read auth/approle/role/billing-prod/role-id`; issue a SecretID with `vault write -f auth/approle/role/billing-prod/secret-id` and deliver it through a separate channel from the RoleID |
| GitHub Actions | `jwt` auth with bound claims on `repository` and `ref`; see the Vault docs for GitHub OIDC |

   TTL values are user inputs from the organization's policy; do not invent them. Shorter limits blast radius; the token must outlive one renewal interval of the Agent.
4. Never bind with wildcards (`bound_service_account_names=*`).

### Output
Policy file and auth role.

### Quality Gate
- `vault policy read billing-prod` prints paths containing `secret/data/`.
- `vault read auth/kubernetes/role/billing-prod` (or the AppRole role) shows `token_policies [billing-prod]` and no `*` in bound names or namespaces.

---

## Phase 3: Deliver With Vault Agent And Prove Least Privilege

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Delivery on Kubernetes with the Vault Agent Injector: annotate the pod template:
```yaml
vault.hashicorp.com/agent-inject: "true"
vault.hashicorp.com/role: "billing-prod"
vault.hashicorp.com/agent-inject-secret-stripe: "secret/data/prod/billing/stripe"
vault.hashicorp.com/agent-inject-template-stripe: |
  {{- with secret "secret/data/prod/billing/stripe" -}}
  STRIPE_KEY={{ .Data.data.api_key }}
  {{- end -}}
```
   The file appears at `/vault/secrets/stripe`. In KV v2 templates the value is under `.Data.data.<key>` (two `data` levels). On a VM, run `vault agent -config=agent.hcl` with an `auto_auth` block and a `template` stanza writing to a file with `perms = "0400"`.
2. The application reads the file (pydantic-settings `secrets_dir`, Spring `configtree:`, caarlos0/env `,file`) or the entrypoint sources it. Do not `export` it into a shell that logs its environment.
3. Prove access from the workload's identity. Get a token for the role (`vault write auth/kubernetes/login role=billing-prod jwt=@/var/run/secrets/kubernetes.io/serviceaccount/token` from inside the pod, or the AppRole login), then:
   - `vault token capabilities <token> secret/data/prod/billing/stripe` prints `read`.
   - `vault token capabilities <token> secret/data/prod/payments/stripe` prints `deny`.
   - `vault token capabilities <token> secret/data/staging/billing/stripe` prints `deny`.
4. Record outputs in `secret_store_config` and `secret_access_policy`.

### Output
`secret_store_config`, `secret_access_policy`.

### Quality Gate
- The three capability checks print exactly `read`, `deny`, `deny`.
- The pod's rendered file exists (`kubectl exec <pod> -c <app> -- ls -l /vault/secrets/stripe` shows it) and the app's startup validation passes.

---

## Common Mistakes To Avoid

- Do not write KV v2 policies without `data/`.
- Do not hand the application a root or admin token, or a token with no TTL.
- Do not put SecretID and RoleID in the same place; together they are a login.
- Do not log the rendered template file or `env` output in the container.

---

## Worked Example

Illustrative. `store_decision` path template `<env>/<service>/<name>`, EKS, Agent Injector installed.

```
$ vault secrets list -format=json | jq -r '."secret/".options.version'
2
$ printf '%s' "$NEW_KEY" | vault kv put -mount=secret prod/billing/stripe api_key=-
====== Secret Path ======
secret/data/prod/billing/stripe
Key              Value
---              -----
version          1
$ vault policy write billing-prod deploy/vault/billing-prod.hcl
Success! Uploaded policy: billing-prod
$ vault token capabilities "$POD_TOKEN" secret/data/prod/billing/stripe
read
$ vault token capabilities "$POD_TOKEN" secret/data/staging/billing/stripe
deny
```

---

## Exit Criteria

DONE when every secret is in KV v2 under the template path, a `data/`-correct read-only policy is bound to the workload identity without wildcards, the Agent delivers the values, and capability checks show read on own paths and deny elsewhere.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Vault is sealed | **Stop**: unsealing is an operator task; contact the Vault owners. |
| Phase 2 | `permission denied` on read despite policy | **Retry**: check the policy uses `secret/data/...` and the token carries the policy (`vault token lookup`). |
| Phase 3 | Agent init container stuck | **Adjust**: read `kubectl logs <pod> -c vault-agent-init`; usual causes are a wrong role name or the service account not matching `bound_service_account_names`. |
| Phase 3 | Capability check prints `read` for another service's path | **Stop**: the policy glob is too broad; narrow it and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
