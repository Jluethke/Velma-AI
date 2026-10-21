# Destroy Safeguards for Stateful Resources

**One-line description:** Layers protection against accidental deletion: Terraform `prevent_destroy`, provider and cloud-side deletion protection arguments, final snapshots, cloud locks, and CI rules that forbid destroy runs and `-target` outside a separate approved path, each proven by a plan or API call that fails.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root modules to protect.
- `cloud` (string, required): `aws`, `gcp`, or `azure`.
- `plan_review` (object, required): From `tf-plan-review`; lists stateful resources found in the plans.

---

## Outputs

- `protected_resources` (object[]): Each stateful resource with the layers applied (lifecycle, provider argument, cloud lock, snapshot).
- `destroy_guard_config` (object): CI rules: forbidden commands and flags, the separate destroy workflow, and who approves it.

---

## Phase 1: Inventory Stateful Resources

### Entry Criteria
- State is readable.

### Actions
1. List candidates per root: `terraform state list | grep -E 'aws_db_instance|aws_rds_cluster|aws_s3_bucket$|aws_s3_bucket\.|aws_dynamodb_table|aws_efs_file_system|aws_ebs_volume|aws_kms_key|aws_route53_zone|google_sql_database_instance|google_storage_bucket|google_container_cluster|google_kms_crypto_key|azurerm_storage_account|azurerm_mssql_database|azurerm_key_vault|azurerm_kubernetes_cluster'`.
2. Add any resource the user says holds data that cannot be recreated.
3. Record each in `protected_resources`.

### Output
Inventory.

### Quality Gate
- The grep ran in every root and its output is recorded.

---

## Phase 2: Apply Protection Layers

### Entry Criteria
- Inventory exists.

### Actions
1. Terraform layer on every inventoried resource:
```
lifecycle {
  prevent_destroy = true
}
```
   Limits: it only protects while the block is in the code. Deleting the resource block, or removing the lifecycle setting, removes protection. It does not stop deletion outside Terraform.
2. Provider and cloud layer (real arguments; confirm on the Registry page for your provider version):

| Resource | Argument |
|---|---|
| `aws_db_instance`, `aws_rds_cluster` | `deletion_protection = true`; `skip_final_snapshot = false` with `final_snapshot_identifier` |
| `aws_dynamodb_table` | `deletion_protection_enabled = true` |
| `aws_instance` | `disable_api_termination = true` |
| `aws_lb` | `enable_deletion_protection = true` |
| `aws_s3_bucket` | keep `force_destroy = false` (the default) |
| `google_sql_database_instance` | `deletion_protection = true` (Terraform-side, default true) and `settings { deletion_protection_enabled = true }` (API-side) |
| `google_container_cluster` | `deletion_protection = true` |
| `google_compute_instance` | `deletion_protection = true` |
| `azurerm` resource groups | provider `features { resource_group { prevent_deletion_if_contains_resources = true } }` |
| any `azurerm` resource | `azurerm_management_lock` with `lock_level = "CanNotDelete"` |

3. Change one root at a time; plan; these arguments should show as `~ update in-place`, never as replacement.

### Output
`protected_resources` with layers.

### Quality Gate
- `terraform plan -destroy -input=false` in a non-production copy of the root fails with "Instance cannot be destroyed" naming each protected resource (run it; never apply a destroy plan).
- Normal `terraform plan` shows the new arguments as in-place updates and no `forces replacement`.

---

## Phase 3: CI Rules

### Entry Criteria
- Layers applied.

### Actions
1. Forbid in normal pipelines: `terraform destroy`, `plan -destroy`, `apply -destroy`, `-target`, `-replace` without review, `apply -auto-approve` without a saved plan. Put the check in a script `ci/forbid-destroy.sh` (so the pattern text is not inside the files it scans) and call it from CI:
```
#!/usr/bin/env sh
files=$(ls .github/workflows/*.yml .gitlab-ci.yml 2>/dev/null | grep -v 'destroy')
if grep -nE 'terraform +(destroy|apply +-destroy|plan +-destroy)|-target=|-auto-approve' $files; then
  echo "Forbidden Terraform command in pipeline files"; exit 1
fi
```
   The `grep -v 'destroy'` excludes only the separate destroy workflow file (Action 2); name that file so it contains `destroy` and nothing else does. Adjust the file list to the paths used.
2. Destroy, when really needed, runs in a separate manually triggered workflow with its own environment and named approvers, and requires the `prevent_destroy` removal to be merged first through review.
3. HCP Terraform: leave the workspace setting that allows destroy plans off for production workspaces.
4. Pair with the conftest delete rule from `tf-plan-policy-conftest`.

### Output
`destroy_guard_config`.

### Quality Gate
- `sh ci/forbid-destroy.sh; echo $?` prints 0 on the current CI files, and prints 1 after temporarily adding `terraform destroy` to a normal pipeline file (revert after the check).
- The separate destroy workflow file exists and names its environment and approvers.

---

## Worked Example

Illustrative. `cloud = aws`; `live/prod/data` holds `aws_db_instance.main` and `aws_s3_bucket.exports`.

- Phase 1: grep lists both.
- Phase 2: `prevent_destroy = true` on both; `deletion_protection = true`, `skip_final_snapshot = false`, `final_snapshot_identifier = "acme-prod-final"` on the database. Plan: `~ deletion_protection = false -> true` in place. In a staging copy, `terraform plan -destroy` prints "Error: Instance cannot be destroyed ... aws_db_instance.main has lifecycle.prevent_destroy set".
- Phase 3: `ci/forbid-destroy.sh` exits 0 and exits 1 on the temporary mutation; `destroy.yml` uses `workflow_dispatch` and environment `prod-destroy` with two required reviewers.

---

## Exit Criteria

DONE when every stateful resource has the Terraform and provider layers, a destroy plan fails on them, and CI forbids destroy outside the separate approved workflow.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Adding the argument forces replacement | **Stop**: do not apply; check the Registry docs and provider version. |
| Phase 2 | Argument unknown to the locked provider | **Adjust**: protection argument is newer than the provider; use `tf-provider-upgrade` or a cloud lock instead. |
| Phase 3 | Grep matches a legitimate documented use | **Adjust**: move that command into the separate destroy workflow, not an exception list. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
