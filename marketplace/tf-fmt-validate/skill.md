# Terraform fmt and validate Gate

**One-line description:** Runs `terraform fmt -check -recursive` and `terraform validate -json` against every root and child module without touching remote state, reads the JSON diagnostics, and fixes one error at a time until both pass.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root module paths; child modules under `modules/` are found from the repo root.

---

## Outputs

- `fmt_validate_report` (object): Per module directory, fmt result (files needing format), validate result (`valid`, `error_count`, `warning_count`), and each diagnostic's summary, file and line.

---

## Phase 1: Format

### Entry Criteria
- `terraform version` runs.

### Actions
1. From the repo root run `terraform fmt -check -recursive -diff`. Exit code 0 means formatted. A non-zero exit lists the files that need formatting.
2. To fix, run `terraform fmt -recursive` and commit the result in its own commit, separate from logic changes, so reviewers can skip it.
3. Do not hand-align `=` signs; fmt owns whitespace.

### Output
fmt result per directory.

### Quality Gate
- `terraform fmt -check -recursive` exits 0 (`echo $?` prints 0).

---

## Phase 2: Validate Every Module

### Entry Criteria
- fmt passes.

### Actions
1. For each directory (each root module and each `modules/<x>`):
```
terraform -chdir=<dir> init -backend=false -input=false
terraform -chdir=<dir> validate -json > validate-<name>.json
```
   `-backend=false` installs providers and modules without contacting remote state, so validate needs no cloud credentials.
2. Read the JSON: `jq '{valid, error_count, warning_count}' validate-<name>.json` and `jq -r '.diagnostics[] | "\(.severity) \(.summary) \(.range.filename):\(.range.start.line)"' validate-<name>.json`.
3. Store the JSON files outside the repo or delete them after reading; do not commit them.

### Output
Diagnostics per directory.

### Quality Gate
- Every directory has a recorded `valid` value.

---

## Phase 3: Fix Errors One at a Time

### Entry Criteria
- At least one `valid: false`, otherwise skip to exit.

### Actions
1. Take the FIRST error only. Use this table:

| Diagnostic summary | Fix |
|---|---|
| Reference to undeclared input variable | Add the `variable` block, or fix the spelling in the reference |
| Unsupported argument | Check the provider docs for the resource at the locked provider version; remove or rename the argument; do not guess names |
| Missing required argument | Add the argument named in the detail |
| Invalid reference / Reference to undeclared resource | Fix the address (`type.name`, `module.x.output`) |
| Module not installed | Rerun `init -backend=false` |
| Incorrect attribute value type | Match the declared `type` (for example wrap in `tolist()` or fix the variable type) |

2. Edit ONE file, rerun validate for that directory, and confirm the error count went down by at least one.
3. Do not delete a resource, variable or module call to make validate pass. Do not add `# tflint-ignore` or lifecycle `ignore_changes` to silence validate errors (they do not apply to validate anyway).
4. Warnings (for example deprecated attributes) are recorded and fixed after errors; they do not fail the gate.

### Output
`fmt_validate_report` with zero errors.

### Quality Gate
- `jq .error_count validate-<name>.json` prints 0 for every directory.
- `git diff --stat` shows only files you intended to change, and no `.tf` file deleted.

---

## Worked Example

Illustrative. `live/dev/app` and `modules/s3-bucket`.

- Phase 1: `terraform fmt -check -recursive -diff` lists `live/dev/app/main.tf`; `terraform fmt -recursive` fixes it; recheck exits 0.
- Phase 2: `jq '{valid, error_count}'` prints `{"valid": false, "error_count": 2}`. Diagnostics: `error Unsupported argument live/dev/app/main.tf:14` and `error Reference to undeclared input variable live/dev/app/main.tf:22`.
- Phase 3: line 14 used `acl = "private"` on `aws_s3_bucket`, which AWS provider 5.x removed; replaced with an `aws_s3_bucket_ownership_controls` resource per the provider upgrade guide; rerun shows error_count 1. Line 22 typo `var.enviroment` fixed; rerun prints `"valid": true, "error_count": 0`.

---

## Exit Criteria

DONE when fmt check exits 0 and every module's validate JSON shows `error_count` 0.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Init fails downloading a private module | **Adjust**: configure git credentials or registry token (`TF_TOKEN_<host>`); retry. |
| Phase 2 | Init fails on lock file checksum | **Return**: hand to `tf-version-pinning` to add the platform hash. |
| Phase 3 | Same error persists after a fix | **Retry**: reread the diagnostic's `detail` field (`jq '.diagnostics[0].detail'`) and the provider docs; after three tries report the error instead of guessing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
