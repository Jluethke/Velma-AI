# Review a Terraform Plan with a Checklist and jq

**One-line description:** Produces a saved plan file and its JSON form, extracts every create, update, replace and delete with `jq`, flags replacements and deletes of stateful resources, IAM and network exposure changes, and out-of-band drift, and returns an APPROVE or BLOCK verdict from explicit rules.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root module to plan (one at a time).
- `env_strategy` (object, required): From `tf-env-strategy`; supplies the exact init and plan commands.
- `target_environment` (string, required): Environment being planned, for example `prod`.

---

## Outputs

- `plan_file` (string): Path of the saved binary plan (`tfplan`), applied later exactly as reviewed.
- `plan_json` (string): Path of `terraform show -json tfplan` output (contains sensitive values; never commit).
- `plan_review` (object): Counts by action, list of replaces and deletes with reasons, checklist results, and verdict APPROVE or BLOCK with the rule that decided it.

---

## Phase 1: Produce the Plan

### Entry Criteria
- `terraform init` for `target_environment` succeeded using the command in `env_strategy`.

### Actions
1. Plan with a saved file, no prompts, and a lock wait:
```
terraform plan -input=false -lock-timeout=5m -out=tfplan
```
   The 5m lock wait is an example; use the team's agreed value. Never add `-target` for a normal change; `-target` plans leave the rest of the config unreconciled.
2. Write the text and JSON forms:
```
terraform show -no-color tfplan > plan.txt
terraform show -json tfplan > plan.json
```
3. If the plan prints "Note: Objects have changed outside of Terraform", record the listed objects as drift. They are not caused by this change.

### Output
`plan_file`, `plan_json`, `plan.txt`.

### Quality Gate
- `tfplan` and `plan.json` exist; `jq .format_version plan.json` prints a version string.

---

## Phase 2: Extract Changes

### Entry Criteria
- `plan.json` exists.

### Actions
1. All non-no-op changes:
```
jq -r '.resource_changes[] | select(.change.actions != ["no-op"] and .change.actions != ["read"]) | "\(.change.actions | join(",")) \(.address)"' plan.json
```
2. Deletes and replaces (a replace is `["delete","create"]` or `["create","delete"]`):
```
jq -r '.resource_changes[] | select(.change.actions | index("delete")) | "\(.change.actions | join(",")) \(.address) reason=\(.action_reason // "none")"' plan.json
```
3. For each replace, list the attributes that force it: `jq -r '.resource_changes[] | select(.address=="<addr>") | .change.replace_paths'`. In `plan.txt` the same lines are marked `# forces replacement`.
4. Text symbols: `+` create, `-` destroy, `~` update in place, `-/+` destroy then create, `+/-` create then destroy (create_before_destroy), `<=` data source read.
5. Count by action and compare with the summary line `Plan: X to add, Y to change, Z to destroy.`

### Output
Change lists.

### Quality Gate
- The jq counts of create, update and delete actions match X, Y and Z in the summary line (each replace counts once in add and once in destroy).

---

## Phase 3: Checklist and Verdict

### Entry Criteria
- Change lists exist.

### Actions
1. Answer each item with YES or NO and the matching addresses:

| # | Check | How to find |
|---|---|---|
| 1 | Delete or replace of a stateful type (databases, buckets, disks, file systems, KMS keys, DNS zones, queues): for example `aws_db_instance`, `aws_rds_cluster`, `aws_s3_bucket`, `aws_dynamodb_table`, `aws_ebs_volume`, `aws_efs_file_system`, `aws_kms_key`, `google_sql_database_instance`, `google_storage_bucket`, `azurerm_storage_account`, `azurerm_mssql_database` | Phase 2 delete list filtered by type |
| 2 | IAM or role binding changes | addresses containing `iam`, `role`, `policy`, `role_assignment` |
| 3 | Network exposure: `0.0.0.0/0` or `::/0` added | `grep -n '0.0.0.0/0\|::/0' plan.txt` on `+` lines |
| 4 | Changes outside the files in the pull request | compare addresses with the diff |
| 5 | Drift noted in Phase 1 | Phase 1 record |
| 6 | Values shown as `(known after apply)` on identifiers other resources depend on | `plan.txt` |
| 7 | Provider or module version changed in this change | `git diff .terraform.lock.hcl` and module `ref=` |

2. Verdict rules, first match wins:

| Condition | Verdict |
|---|---|
| Check 1 is YES and the pull request description does not name that address as intended | BLOCK |
| Check 4 is YES (changes the code did not ask for) | BLOCK until explained |
| Check 5 is YES | BLOCK until drift is resolved with `tf-drift-detect` |
| Checks 2 or 3 YES | APPROVE only with a second reviewer named |
| Otherwise | APPROVE |

3. Apply only the reviewed file: `terraform apply -input=false tfplan`. If state changed since the plan, Terraform rejects the saved plan as stale; re-plan and re-review.
4. Delete `plan.json` and `plan.txt` after review if they were written locally.

### Output
`plan_review`.

### Quality Gate
- All seven checks have YES or NO recorded.
- The verdict cites one row of the verdict table.

---

## Worked Example

Illustrative. `live/prod/app`, pull request "raise RDS instance class".

- Phase 1: `Plan: 1 to add, 1 to change, 1 to destroy.`
- Phase 2: jq shows `update aws_db_instance.main` and `delete,create aws_db_parameter_group.main reason=replace_because_cannot_update`; `replace_paths` shows `[["family"]]`.
- Phase 3: Check 1 NO (parameter group is not in the stateful list, the database is updated in place). Check 4 YES: the PR did not mention the parameter group family. Verdict BLOCK until explained. Author confirms the family change is required by the new engine version and updates the PR description; re-review gives APPROVE.

---

## Exit Criteria

DONE when a saved plan exists, every change is listed, all checklist items are answered, and a verdict with its rule is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Lock timeout | **Retry**: once after the other run finishes; never `force-unlock` a live run. |
| Phase 1 | Plan errors on credentials | **Stop**: wrong environment or role; recheck `env_strategy` commands. |
| Phase 3 | Saved plan rejected as stale at apply | **Retry**: re-plan and redo Phases 2 and 3. |
| Phase 3 | Verdict BLOCK | **Return**: send the checklist to the author; do not apply. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
