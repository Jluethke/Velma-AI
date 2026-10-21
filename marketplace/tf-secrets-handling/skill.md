# Keep Secrets Out of Terraform Code, Plans and State

**One-line description:** Finds secrets in Terraform code and state, moves each one to the safest available mechanism (provider-managed secret, write-only argument, ephemeral resource, or secret-store data source), and accounts for what still lands in state.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root module paths to inspect.
- `cloud` (string, required): `aws`, `gcp`, or `azure`.
- `secret_inventory` (object[], optional): Known secrets: name, where it is used, current source.

---

## Outputs

- `secret_sources` (object[]): Per secret: the mechanism chosen from the decision table, the resource argument, and whether the value is still stored in state.
- `secret_findings` (object[]): Every secret found in code, tfvars, git history, plan output or state, with file and line or state address.

---

## Phase 1: Find Secrets

### Entry Criteria
- Read access to the repo and to state (`terraform state pull` works).

### Actions
1. Scan the working tree and history with gitleaks: `gitleaks git -v .` on gitleaks 8.19 or later, or `gitleaks detect --source . -v` on older 8.x. Run `gitleaks --help` to confirm which subcommand your version has.
2. Grep tfvars and code for literal secrets: `grep -rnEi '(password|secret|token|private_key|access_key)\s*=\s*"[^"$]' --include='*.tf' --include='*.tfvars' .`
3. List variables that should be sensitive but are not: find variables whose names match the pattern above and check each has `sensitive = true`.
4. Inspect state for secret attributes without printing them to a shared log: `terraform state pull | jq -r '.resources[] | select(.instances[].sensitive_attributes | length > 0) | "\(.type).\(.name)"'`. This lists resources that hold sensitive values in state.
5. Record each hit in `secret_findings`. Do not paste secret values into the findings, only locations.

### Output
`secret_findings`.

### Quality Gate
- gitleaks ran and its summary line (leaks found count) is recorded.
- The jq state command ran for every root module and its output is recorded.

---

## Phase 2: Choose a Mechanism per Secret

### Entry Criteria
- Findings recorded.

### Actions
1. For each secret pick the FIRST row that is available for your provider and Terraform version:

| Mechanism | Example | Value in state? |
|---|---|---|
| Cloud generates and stores the secret itself | `aws_db_instance` with `manage_master_user_password = true` (RDS stores it in Secrets Manager) | No |
| Write-only argument (Terraform 1.11+, provider must offer `*_wo` arguments) | `password_wo = ephemeral.random_password.db.result` with `password_wo_version = 1` | No |
| Ephemeral resource (Terraform 1.10+) feeding a provider config or write-only argument | `ephemeral "aws_secretsmanager_secret_version" "db" { secret_id = "prod/db" }` | No |
| Data source reading a secret store | `data "aws_secretsmanager_secret_version"`, `data "google_secret_manager_secret_version"`, `data "azurerm_key_vault_secret"` | Yes |
| Sensitive variable from `TF_VAR_<name>` in CI | `variable "db_password" { sensitive = true }` | Yes |

2. Check the provider documentation page for the resource to confirm a `*_wo` argument or ephemeral resource exists in your locked provider version (`.terraform.lock.hcl`). Do not invent argument names.
3. Never: commit a tfvars file with a secret, pass a secret with `-var` on a CI command line (it appears in process listings and logs), or output a secret without `sensitive = true`.
4. For every row where the value stays in state, record that the state backend must be encrypted and access-restricted (see the backend flows) and that state readers can read the secret.

### Output
`secret_sources`.

### Quality Gate
- Every finding maps to one mechanism row.
- Every mechanism that relies on a version is confirmed against `terraform version` and the lock file version, with the doc page cited.

---

## Phase 3: Apply and Verify

### Entry Criteria
- Mechanisms chosen.

### Actions
1. Change ONE secret at a time; run `terraform plan` after each.
2. Read the plan: sensitive values show as `(sensitive value)`. A literal secret printed in plan output is a failure.
3. After apply in a non-production environment, rerun the Phase 1 state jq command; resources moved to write-only or provider-managed mechanisms should no longer list the secret attribute. Confirm with `terraform state show <address>` that the argument shows as null or absent.
4. Any secret that was ever committed or printed must be rotated in the secret store; removing it from code does not remove it from git history or old state versions.

### Output
Updated `secret_sources` and resolved findings.

### Quality Gate
- `terraform plan -no-color | grep -c '(sensitive value)'` is at least the number of sensitive arguments changed, and a grep for each known secret prefix in the plan text finds nothing.
- gitleaks rerun on the working tree reports zero leaks in current files.

---

## Worked Example

Illustrative. Root `live/prod/rds`, AWS provider 5.x, Terraform 1.9.

- Phase 1: gitleaks reports 1 leak in `terraform.tfvars` line 4 (`db_password`). State jq lists `aws_db_instance.main`.
- Phase 2: Terraform 1.9 has no write-only arguments, so the first available row is `manage_master_user_password = true`.
- Phase 3: plan shows `~ manage_master_user_password = false -> true` and `- password = (sensitive value)`. After apply, `terraform state show aws_db_instance.main` shows `master_user_secret` with a Secrets Manager ARN and no password. The leaked password is rotated and the tfvars line deleted.

---

## Exit Criteria

DONE when no secret is in code or tfvars, every secret has a mechanism from the table, secrets still in state are documented with backend encryption, and leaked values are rotated.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Secret found in git history | **Stop**: report to the owner; rotate first, then rewrite history only if the owner decides to. |
| Phase 2 | Provider version lacks the write-only argument | **Adjust**: use the next row; or plan a provider upgrade with `tf-provider-upgrade`. |
| Phase 3 | Plan wants to replace the database when switching password mechanism | **Stop**: read the plan's "forces replacement" line; do not apply; find an in-place path in the provider docs. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
