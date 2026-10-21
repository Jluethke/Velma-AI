# Terraform Repo Layout and State Boundaries

**One-line description:** Lays out a Terraform repository as reusable child modules plus one small root module per environment and component, with fixed file names, a correct .gitignore, and state boundaries drawn by blast radius and change rate.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository root (new or existing).
- `cloud` (string, required): Primary provider family: `aws`, `gcp`, or `azure`.
- `environments` (string[], required): Environment names in promotion order, for example `["dev", "staging", "prod"]`.
- `components` (string[], required): Infrastructure components to manage, for example `["network", "data", "compute", "iam"]`.

---

## Outputs

- `repo_layout` (object): Directory tree, the purpose of each directory, and the file naming convention, written to `docs/terraform-layout.md` in the repo.
- `root_modules` (string[]): Repo-relative paths of every root module (a directory where `terraform init` is run), for example `live/prod/network`.

---

## Phase 1: Inventory What Exists

### Entry Criteria
- `repo_dir` exists and is a git working tree (`git -C <repo_dir> rev-parse --show-toplevel` prints a path).

### Actions
1. List every directory that contains `.tf` files:
   `git -C <repo_dir> ls-files "*.tf" | xargs -n1 dirname | sort -u`
   (PowerShell: `git ls-files *.tf | Split-Path | Sort-Object -Unique`).
2. For each directory, mark it ROOT if it contains a `backend` block, a `cloud` block, or a `provider` block, otherwise CHILD. Check with:
   `grep -lE '^\s*(backend|cloud)\s*("|\{)|^provider\s+"' <dir>/*.tf`
3. If any state files are committed, stop and record them: `git -C <repo_dir> ls-files | grep -E '\.tfstate(\.|$)'`. A committed state file leaks every attribute, including secrets.
4. Record the result as a table: directory, ROOT or CHILD, provider types used, backend type.

### Output
Inventory table of existing Terraform directories (empty for a new repo).

### Quality Gate
- The `git ls-files` command in Action 1 was run and its output is pasted in the inventory.
- The tfstate check in Action 3 printed nothing, or each listed file is recorded as a finding.

---

## Phase 2: Choose State Boundaries

### Entry Criteria
- Inventory complete.

### Actions
1. Start from one root module per (environment, component) pair. Do not put all components of an environment in one state: one state means one lock, one slow plan, and a single bad apply that can touch everything.
2. Apply this table to merge or split components. Use only these rules:

| Condition | Rule |
|---|---|
| Two components are always changed in the same pull request | Merge them into one root module |
| A component holds data that cannot be recreated (databases, buckets, KMS keys, DNS zones) | Its own root module, separate from compute |
| A component changes daily (app services) and another rarely (VPC, IAM baseline) | Separate root modules |
| Different teams approve changes | Separate root modules so each state has its own access policy |
| A component needs credentials another must not have (org-level IAM) | Separate root module and separate CI role |

3. Write down how a root module reads another root module's values. Prefer provider data sources (`data "aws_vpc"` with a tag filter, `data "google_compute_network"`, `data "azurerm_virtual_network"`) or a parameter store (`aws_ssm_parameter`, `azurerm_app_configuration_key`) over `terraform_remote_state`, because `terraform_remote_state` needs read access to the whole other state file, secrets included.
4. Do not create cycles: if network reads data and data reads network, merge them or move the shared value to a third root module.

### Output
List of root modules with component, environment, and cross-state reads.

### Quality Gate
- Every component in `components` is assigned to exactly one root module per environment.
- The cross-state read list has no cycle (each read points from a later-applied root module to an earlier one).

---

## Phase 3: Write the Tree and Conventions

### Entry Criteria
- Root module list fixed.

### Actions
1. Create this tree (directories only, files are filled by later flows):
```
modules/<module>/        main.tf variables.tf outputs.tf versions.tf README.md
live/<env>/<component>/  main.tf variables.tf outputs.tf versions.tf providers.tf backend.tf terraform.tfvars
docs/terraform-layout.md
```
2. File conventions, one job per file: `versions.tf` holds the `terraform { required_version, required_providers }` block; `providers.tf` holds `provider` blocks (root modules only); `backend.tf` holds the backend or `cloud` block (root modules only); `variables.tf` and `outputs.tf` hold only variables and outputs.
3. Child modules under `modules/` never contain `provider`, `backend`, or `cloud` blocks. A provider block in a child module blocks `count`/`for_each` on the module call and makes removing the module fail.
4. Write `<repo_dir>/.gitignore` entries (append, do not remove existing lines):
```
.terraform/
*.tfstate
*.tfstate.*
*.tfplan
tfplan
crash.log
crash.*.log
override.tf
override.tf.json
*_override.tf
*_override.tf.json
*.auto.tfvars.secret
```
5. Do NOT ignore `.terraform.lock.hcl`. It must be committed in every root module.
6. Write `docs/terraform-layout.md` with the tree, the Phase 2 table, and the cross-state reads. This file is `repo_layout`.

### Output
`repo_layout` and `root_modules`.

### Quality Gate
- `git -C <repo_dir> check-ignore -v live/dev/network/.terraform.lock.hcl` prints nothing (lock file is not ignored).
- `git -C <repo_dir> check-ignore -v live/dev/network/terraform.tfstate` prints the `*.tfstate` rule.
- `grep -rlE '^\s*(provider|backend)\s+"' modules/` prints nothing.

---

## Worked Example

Illustrative. Input: `cloud = "aws"`, `environments = ["dev", "prod"]`, `components = ["network", "rds", "ecs-service"]`.

- Phase 1: `git ls-files "*.tf"` shows one folder `infra/` with a backend block and 41 resources across VPC, RDS and ECS. Tfstate check prints nothing.
- Phase 2: `rds` holds data that cannot be recreated, so it is its own root. `ecs-service` changes daily, so it is separate from `network`. Cross-state reads: `rds` and `ecs-service` read VPC and subnet IDs from SSM parameters written by `network`.
- Phase 3: `root_modules` = `["live/dev/network", "live/dev/rds", "live/dev/ecs-service", "live/prod/network", "live/prod/rds", "live/prod/ecs-service"]`. `git check-ignore -v live/dev/network/terraform.tfstate` prints `.gitignore:2:*.tfstate	live/dev/network/terraform.tfstate`. Splitting the existing `infra/` state into these roots is done later with `tf-moved-refactor` and `tf-state-surgery`, never by deleting and recreating.

---

## Exit Criteria

DONE when `docs/terraform-layout.md` exists, every component maps to one root module per environment, child modules hold no provider or backend blocks, and the .gitignore gates pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A `.tfstate` file is committed | **Stop**: report it; the state must be moved to a remote backend and the file removed from history by the repo owner; secrets in it must be rotated. |
| Phase 1 | Existing code mixes provider blocks into child modules | **Adjust**: record each one; move the provider block up to the calling root module and pass providers with the `providers` meta-argument. |
| Phase 2 | Cross-state reads form a cycle | **Adjust**: move the shared value into a third root module applied first. |
| Phase 3 | Existing resources live in one large state | **Return**: hand the split to `tf-moved-refactor` and `tf-state-surgery`; never delete and recreate resources to change layout. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
