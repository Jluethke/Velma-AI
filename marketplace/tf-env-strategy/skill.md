# Terraform Environments: Workspaces vs Directories

**One-line description:** Chooses between CLI workspaces, one directory per environment, or one root module with per-environment var and backend files, using a decision table, then writes the exact init, plan and apply commands for each environment.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_layout` (object, required): Layout from `tf-repo-layout`.
- `environments` (string[], required): Environment names, for example `["dev", "staging", "prod"]`.
- `isolation_requirements` (object, optional): Per environment: separate cloud account or project or subscription (yes/no), separate approvers (yes/no), short-lived (yes/no).

---

## Outputs

- `env_strategy` (object): Chosen pattern (`directories`, `shared-root-varfiles`, or `workspaces`), the reason row from the decision table, and for each environment the working directory plus the exact `terraform init`, `plan` and `apply` command lines.

---

## Phase 1: Apply the Decision Table

### Entry Criteria
- `repo_layout` exists. `environments` has at least one entry.

### Actions
1. For each environment, read `isolation_requirements`. If it is missing, ask the user these three questions and record the answers; do not guess.
2. Pick the FIRST row that matches:

| Condition | Pattern |
|---|---|
| Any environment needs separate credentials, a separate account/project/subscription, or separate approvers | `directories` |
| Environments differ in which resources exist (prod has a WAF, dev does not) | `directories` |
| All environments share the same resources and credentials, differ only in values (sizes, counts, CIDRs) | `shared-root-varfiles` |
| Many short-lived copies of the same stack (per pull request, per developer) with the same credentials | `workspaces` |

3. Record the rule: HashiCorp's own CLI workspace documentation says workspaces are not appropriate for deployments that need separate credentials and access controls. Production almost always does, so a `workspaces` choice for prod needs written justification.
4. Do not mix patterns inside one root module.

### Output
Chosen pattern with the matching table row quoted.

### Quality Gate
- The chosen pattern cites exactly one table row.
- Every environment has recorded answers for the three isolation questions.

---

## Phase 2: Write Per-Environment Commands

### Entry Criteria
- Pattern chosen.

### Actions
1. If `directories`: each `live/<env>/<component>` has its own `backend.tf` with a distinct state key, its own `providers.tf`, and its own `terraform.tfvars`. Shared logic lives in `modules/` and is called with environment values. Commands:
```
terraform -chdir=live/prod/network init -input=false
terraform -chdir=live/prod/network plan -input=false -out=tfplan
terraform -chdir=live/prod/network apply -input=false tfplan
```
2. If `shared-root-varfiles`: one root directory with an empty backend block (`backend "s3" {}`) plus per-environment files `env/<env>.tfbackend` and `env/<env>.tfvars`. Re-initialize every time you switch environment:
```
terraform init -input=false -reconfigure -backend-config=env/prod.tfbackend
terraform plan -input=false -var-file=env/prod.tfvars -out=tfplan
```
   `-reconfigure` is required when switching; without it Terraform tries to migrate the previous environment's state into the new key.
3. If `workspaces`: one backend; state per workspace lives under the backend's workspace prefix (for S3, `env:/<workspace>/<key>` by default, changeable with `workspace_key_prefix`). Commands:
```
terraform workspace select -or-create pr-123
terraform plan -input=false -out=tfplan
```
   `-or-create` needs Terraform 1.4 or later; on older versions run `terraform workspace new pr-123` when `select` fails. Reference `terraform.workspace` in names so copies do not collide: `name = "app-${terraform.workspace}"`.
4. In every pattern, put a guard in the root module so a plan against the wrong environment fails early:
```
variable "environment" { type = string }
check "env_matches" {
  assert {
    condition     = var.environment == "prod"
    error_message = "This root module is prod only."
  }
}
```
   Use the matching literal per directory (directories pattern), or compare `var.environment` with the workspace name (workspaces pattern). A `check` block warns; for a hard stop use a `precondition` in a resource `lifecycle` block.
5. Write all command lines into `env_strategy`.

### Output
`env_strategy` with commands per environment.

### Quality Gate
- For each environment, `terraform init` with the recorded command exits 0 (run it; paste the last line "Terraform has been successfully initialized!").
- For `shared-root-varfiles`, every recorded init line contains `-reconfigure` and a `-backend-config` file name that matches the environment name.
- `terraform workspace show` (workspaces pattern) prints the expected workspace before every recorded plan.

---

## Worked Example

Illustrative. Inputs: `environments = ["dev", "prod"]`; dev and prod are separate AWS accounts with separate approvers.

- Phase 1: first matching row is "separate credentials or account": pattern `directories`.
- Phase 2: commands written for `live/dev/network` and `live/prod/network`. Running `terraform -chdir=live/dev/network init -input=false` ends with `Terraform has been successfully initialized!`. Each `providers.tf` sets `assume_role { role_arn = "arn:aws:iam::<account>:role/terraform" }` for its own account, so a dev credential cannot plan prod.

---

## Exit Criteria

DONE when one pattern is chosen from the table with its reason, and every environment has tested init, plan and apply commands recorded in `env_strategy`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Isolation answers unknown | **Stop**: ask the user; the pattern depends on them. |
| Phase 2 | Init asks "Do you want to copy existing state to the new backend?" while switching environments | **Stop**: answer no; rerun with `-reconfigure`. Copying would overwrite the other environment's state. |
| Phase 2 | `workspace select -or-create` flag unknown | **Adjust**: Terraform is older than 1.4; use `terraform workspace new`. |
| Phase 2 | Existing repo uses workspaces for prod with separate accounts | **Return**: record it; migration to directories is a state move handled by `tf-state-surgery`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
