# Remote State on HCP Terraform (Terraform Cloud)

**One-line description:** Connects root modules to HCP Terraform with the `cloud` block, chooses workspace naming or tags, sets execution mode and workspace variables, migrates local or backend state, and confirms the workspace lock and run history.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root module paths to connect.
- `env_strategy` (object, required): From `tf-env-strategy`; one workspace per root module per environment.
- `hcp_organization` (string, required): HCP Terraform organization name.

---

## Outputs

- `backend_config` (object): Per root module, the `cloud` block, workspace name, execution mode, and the list of workspace variables (names only, never values).
- `state_migration_report` (object): Per root module, resource counts before and after, and the first run's plan result.

---

## Phase 1: Prepare Workspaces

### Entry Criteria
- Terraform CLI 1.1 or later (`terraform version`); the `cloud` block does not exist before 1.1.
- `terraform login` completed, or `TF_TOKEN_app_terraform_io` is set (CI uses the environment variable with a team token).

### Actions
1. Name workspaces `<component>-<env>`, for example `network-prod`. One workspace = one state.
2. Choose execution mode per workspace:

| Need | Execution mode |
|---|---|
| Runs must happen in HCP with its credentials and run history | `Remote` |
| Runs need network access to private resources HCP cannot reach | `Agent` (self-hosted agent pool) |
| HCP stores state only; plans run on CI or laptops | `Local` |

3. Set variables in the workspace (UI or `tfe_variable` resources): cloud credentials as Environment variables marked Sensitive, or dynamic provider credentials (OIDC from HCP to the cloud) where the cloud supports it. Terraform variables (`TF_VAR` equivalents) as category `terraform`. A `terraform.tfvars` file in the repo is still read in remote mode; do not put secrets there.
4. Enable "Auto apply" only for non-production workspaces.

### Output
Workspace plan per root module.

### Quality Gate
- Each root module maps to exactly one workspace name.
- Each workspace has a recorded execution mode from the table.

---

## Phase 2: Write the cloud Block

### Entry Criteria
- Workspace names chosen.

### Actions
1. Directories pattern, `live/prod/network/backend.tf`:
```
terraform {
  cloud {
    organization = "acme"
    workspaces {
      name = "network-prod"
    }
  }
}
```
2. Shared-root or workspaces pattern: use `tags = ["component:network"]` instead of `name`; then `terraform workspace select network-prod` picks one. You cannot set both `name` and `tags`.
3. `TF_CLOUD_ORGANIZATION` and `TF_WORKSPACE` environment variables can supply the values in CI; do not set them to conflict with the block.
4. Remove any old `backend` block in the same module; a module has either `backend` or `cloud`, never both.

### Output
`backend_config`.

### Quality Gate
- `grep -l 'backend "' <root>/*.tf` prints nothing in every root that has a `cloud` block.

---

## Phase 3: Migrate and Verify

### Entry Criteria
- Freeze announced for these roots.

### Actions
1. One root at a time: `terraform state pull > pre-migrate.tfstate`; `terraform state list | wc -l`.
2. Run `terraform init`. When a previous backend or local state exists, init detects it and asks whether to migrate it to HCP Terraform; answer `yes`. Check `terraform init -help` for the flags your version offers before using any non-interactive option.
3. `terraform state list | wc -l` must match.
4. `terraform plan`: in Remote mode the CLI streams the remote run and prints a run URL. Plan must say "No changes."
5. Confirm the lock: open the workspace in the UI; while a run is planning the workspace shows as locked by that run. Manually lock with "Lock workspace" when doing state surgery.
6. Move the backup out of the repo.

### Output
`state_migration_report`.

### Quality Gate
- Counts equal; the first remote plan shows "No changes."; the run URL is recorded in the report.

---

## Worked Example

Illustrative. Org `acme`, root `live/prod/network` migrating from S3.

- Phase 1: workspace `network-prod`, mode Remote, AWS dynamic credentials enabled through workspace environment variables.
- Phase 2: `cloud` block written; old `backend "s3"` block removed.
- Phase 3: `terraform init` asks to migrate the existing "s3" state; answered yes. Counts 23 and 23. `terraform plan` prints "Running plan in HCP Terraform..." with the run URL and ends "No changes."

---

## Exit Criteria

DONE when every root module is connected to its own workspace, counts match, the first plan is clean, and secrets live only in sensitive workspace variables.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `terraform login` impossible (headless CI) | **Adjust**: set `TF_TOKEN_app_terraform_io` from the CI secret store. |
| Phase 2 | Error "cloud block and backend block" both present | **Adjust**: delete the `backend` block after taking the Phase 3 backup. |
| Phase 3 | Remote plan fails on missing credentials | **Adjust**: add the provider credentials or dynamic credentials to the workspace, not to the repo. |
| Phase 3 | Plan shows changes | **Stop**: Remote mode may read different variable values than local runs; compare workspace variables with local tfvars before any apply. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
