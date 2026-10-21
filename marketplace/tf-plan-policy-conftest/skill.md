# Gate Terraform Plans with OPA Conftest Policies

**One-line description:** Writes Rego policies over `terraform show -json` output (deny deletes of protected types, deny public ingress, require tags), unit-tests them with `conftest verify`, and runs `conftest test` as a failing CI gate.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `plan_json` (string, required): Path of the JSON plan from `tf-plan-review`.
- `policy_dir` (string, optional): Directory for policies. Default: `policy/`.

---

## Outputs

- `policy_results` (object): Policy files, `conftest verify` summary, and `conftest test` summary with every failure message.

---

## Phase 1: Write Policies

### Entry Criteria
- `conftest --version` runs. `plan_json` exists.

### Actions
1. Learn the input shape: `jq '.resource_changes[0] | {address, type, change: {actions: .change.actions}}' <plan_json>`. Policies read `input.resource_changes[]`.
2. Create `policy/terraform.rego` using Rego v1 syntax (works on OPA 1.x and on 0.59+ through the import):
```
package main

import rego.v1

protected_types := {"aws_db_instance", "aws_rds_cluster", "aws_s3_bucket", "aws_dynamodb_table", "aws_kms_key"}

deny contains msg if {
  rc := input.resource_changes[_]
  "delete" in rc.change.actions
  rc.type in protected_types
  msg := sprintf("%s (%s) would be deleted or replaced", [rc.address, rc.type])
}

deny contains msg if {
  rc := input.resource_changes[_]
  rc.type == "aws_security_group_rule"
  "create" in rc.change.actions
  rc.change.after.type == "ingress"
  "0.0.0.0/0" in rc.change.after.cidr_blocks
  msg := sprintf("%s opens ingress to 0.0.0.0/0", [rc.address])
}
```
3. Adjust `protected_types` to the types the team lists; do not include types they did not name.
4. Use `warn contains msg if { ... }` for rules that should report but not fail.

### Output
Policy files.

### Quality Gate
- `conftest parse <plan_json> | head` prints JSON (input readable).
- `opa fmt --list policy/` prints nothing if `opa` is installed (policies formatted).

---

## Phase 2: Unit Test the Policies

### Entry Criteria
- Policies exist.

### Actions
1. Create `policy/terraform_test.rego`:
```
package main

import rego.v1

test_deny_db_delete if {
  count(deny) > 0 with input as {"resource_changes": [{"address": "aws_db_instance.main", "type": "aws_db_instance", "change": {"actions": ["delete", "create"]}}]}
}

test_allow_db_update if {
  count(deny) == 0 with input as {"resource_changes": [{"address": "aws_db_instance.main", "type": "aws_db_instance", "change": {"actions": ["update"]}}]}
}
```
2. Run `conftest verify --policy policy/`. Output ends with `N tests, N passed, 0 warnings, 0 failures, 0 exceptions`.
3. Write one deny test and one allow test per rule. A rule without a failing-input test is not proven to fire.

### Output
Policy tests.

### Quality Gate
- `conftest verify --policy policy/` reports 0 failures and the test count equals two times the number of rules.

---

## Phase 3: Run as a Gate

### Entry Criteria
- Policies verified.

### Actions
1. `conftest test <plan_json> --policy policy/`. Exit code non-zero when any `deny` fires.
2. Read output: `FAIL - <plan_json> - main - aws_db_instance.main (aws_db_instance) would be deleted or replaced` and the summary `N tests, X passed, Y warnings, Z failures, 0 exceptions`.
3. In CI, run it after plan and before any apply job; the apply job must depend on it.
4. Exceptions: when a delete is intended, the pull request must change policy input deliberately (for example an `allowed_deletes` list in a data file passed with `--data`), reviewed like code. Never disable the step or add `|| true`.

### Output
`policy_results`.

### Quality Gate
- `echo $?` after `conftest test` is recorded; 0 for an allowed plan.
- CI config shows the apply job depends on the conftest job (job `needs:` lists it).

---

## Worked Example

Illustrative. Plan replaces `aws_s3_bucket.assets` because the bucket name changed.

- Phase 1: rules for protected deletes and public ingress.
- Phase 2: `conftest verify --policy policy/` prints `4 tests, 4 passed, 0 warnings, 0 failures, 0 exceptions`.
- Phase 3: `conftest test plan.json --policy policy/` prints `FAIL - plan.json - main - aws_s3_bucket.assets (aws_s3_bucket) would be deleted or replaced` and `2 tests, 1 passed, 0 warnings, 1 failure, 0 exceptions`. The author reverts the name change; re-plan passes.

---

## Exit Criteria

DONE when policies are unit-tested, the gate runs on the plan JSON, and CI apply depends on it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rego_parse_error` on `contains`/`if` | **Adjust**: add `import rego.v1` or upgrade conftest; check `conftest --version`. |
| Phase 2 | A deny test passes with empty input | **Adjust**: the rule is too broad; tighten the condition and rerun. |
| Phase 3 | Rule never fires on real plans | **Adjust**: compare field paths with `jq` on the real `plan_json`; `change.after` is null for deletes. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
