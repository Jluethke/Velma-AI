# Unit Test a Module with terraform test and Mock Providers

**One-line description:** Writes `.tftest.hcl` files for a child module with `command = plan` runs, assertions on planned values, `expect_failures` for input validation, and `mock_provider` so tests run without cloud credentials.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `module_interface` (object, required): From `tf-module-interface`: variables, validations, outputs.
- `module_files` (string[], required): The module's files.

---

## Outputs

- `module_test_results` (object): Test files written, run names, and the final `terraform test` summary line.

---

## Phase 1: Plan the Cases

### Entry Criteria
- `terraform version` is 1.6 or later (`terraform test` exists from 1.6; `mock_provider` from 1.7).

### Actions
1. List cases from `module_interface`:
   - One "defaults" case: required inputs only, assert the hard-coded policies (public access blocked, versioning on).
   - One case per `validation` block: an invalid value that must be rejected.
   - One case per conditional resource (`count = var.x ? 1 : 0`): on and off.
2. Choose run mode per case:

| Case | `command` | Provider |
|---|---|---|
| Asserting configured arguments | `plan` | `mock_provider` |
| Asserting values only known after create (IDs, ARNs) | `apply` | `mock_provider` (mock returns generated values) |
| Proving the real API accepts it | `apply` | Real provider in a sandbox account, run separately |

### Output
Case list.

### Quality Gate
- Every validation block in `module_interface` has a failing case.

---

## Phase 2: Write the Tests

### Entry Criteria
- Case list exists.

### Actions
1. Create `modules/<name>/tests/defaults.tftest.hcl`:
```
mock_provider "aws" {}

variables {
  name = "acme-test-logs"
}

run "public_access_blocked" {
  command = plan
  assert {
    condition     = aws_s3_bucket_public_access_block.this.block_public_acls && aws_s3_bucket_public_access_block.this.restrict_public_buckets
    error_message = "Public access block must be on."
  }
}

run "rejects_uppercase_name" {
  command = plan
  variables {
    name = "Bad_Name"
  }
  expect_failures = [var.name]
}
```
2. Use the exact resource addresses from the module code; read `main.tf` instead of guessing attribute paths. Nested blocks declared as lists can be indexed (`rule[0]`); blocks declared as sets cannot, so assert with `anytrue([for r in <block> : <test>])` or on a top-level argument. If unsure which a block is, read `terraform providers schema -json` for the resource.
3. Tests run against the module directory where `terraform test` is executed; `run` blocks share state in order unless they use separate `state_key` (1.9+) or modules.

### Output
Test files.

### Quality Gate
- `terraform fmt -check modules/<name>/tests` exits 0.

---

## Phase 3: Run and Read

### Entry Criteria
- Test files exist.

### Actions
1. In the module directory: `terraform init -backend=false` then `terraform test`. Use `terraform test -filter=tests/defaults.tftest.hcl` to run one file and `-verbose` to print plans.
2. Read results: each run prints `run "name"... pass` or `... fail` followed by the assertion's `error_message`. The last line is `Success! N passed, 0 failed.` or `N passed, M failed.`
3. If a test fails, decide: the module is wrong (fix module) or the assertion path is wrong (fix test). Do not weaken an assertion or delete a run to get a pass.
4. Prove the tests can fail: temporarily change the asserted value in the module (for example `block_public_acls = true` to `false`), run, confirm a `fail`, then revert with `git checkout -- <file>`.

### Output
`module_test_results`.

### Quality Gate
- Final `terraform test` prints `Success!` with 0 failed.
- The mutation check in Action 4 produced a `fail` before the revert.

---

## Worked Example

Illustrative. Module `modules/s3-bucket`, Terraform 1.9.

- Phase 1: cases: defaults (encryption, public access block), invalid name, lifecycle rules on and off.
- Phase 2: `tests/defaults.tftest.hcl` and `tests/lifecycle.tftest.hcl` with `mock_provider "aws" {}`.
- Phase 3: `terraform test` prints:
```
tests/defaults.tftest.hcl... in progress
  run "public_access_blocked"... pass
  run "rejects_uppercase_name"... pass
tests/defaults.tftest.hcl... tearing down
tests/defaults.tftest.hcl... pass
...
Success! 4 passed, 0 failed.
```
  Mutation `block_public_acls = false` makes `public_access_blocked` fail; reverted.

---

## Exit Criteria

DONE when every case runs, the suite passes, and a deliberate mutation was caught.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Terraform older than 1.7 | **Adjust**: drop `mock_provider`; use `command = plan` with a real provider and dummy credentials only where plan needs no API calls, or upgrade the CLI. |
| Phase 3 | "Unknown condition value" on a computed attribute in a plan run | **Adjust**: switch that run to `command = apply` with the mock provider. |
| Phase 3 | `expect_failures` run passes for the wrong reason | **Adjust**: run with `-verbose` and confirm the failure is the named variable's validation. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
