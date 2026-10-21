# Security Scan Terraform with Checkov (Code and Plan)

**One-line description:** Runs Checkov against Terraform source and against the JSON plan, reads each failed check ID with its resource and guide link, fixes or suppresses it inline with a reason, and records a baseline for legacy findings.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root module paths.
- `fmt_validate_report` (object, required): From `tf-fmt-validate`.

---

## Outputs

- `checkov_findings` (object[]): Each failed check: check ID, resource address, file and line range, resolution (fixed, suppressed with reason, or baselined).

---

## Phase 1: Scan Source

### Entry Criteria
- Validate passes. `checkov --version` runs (`pip install checkov` if not).

### Actions
1. From the repo root:
```
checkov -d . --framework terraform --compact --quiet --download-external-modules true
```
   `--quiet` shows only failures; `--compact` hides code blocks; `--download-external-modules true` scans registry and git modules too.
2. Read each failure block:
```
Check: CKV_AWS_18: "Ensure the S3 bucket has access logging enabled"
	FAILED for resource: module.logs.aws_s3_bucket.this
	File: /modules/s3-bucket/main.tf:1-8
	Guide: <link>
```
   Record check ID, resource, file:lines. Open the Guide link to read the fix.
3. Read the summary line: `Passed checks: N, Failed checks: N, Skipped checks: N`.
4. For machine-readable results: `checkov -d . --framework terraform -o json > checkov.json` (store outside the repo).

### Output
Source findings.

### Quality Gate
- The summary line is recorded for the run.

---

## Phase 2: Scan the Plan

### Entry Criteria
- A root module can be planned (credentials available for a non-production environment).

### Actions
1. Source scans miss values from variables and modules that are only known at plan time. Scan the plan too:
```
terraform plan -input=false -out=tfplan
terraform show -json tfplan > tfplan.json
checkov -f tfplan.json --framework terraform_plan --compact --quiet
```
2. `tfplan.json` contains every planned attribute, including sensitive values. Delete it after the scan; never commit or upload it as a public artifact.

### Output
Plan findings merged with source findings (deduplicated by check ID and resource).

### Quality Gate
- The plan scan summary line is recorded; `tfplan.json` is deleted (`ls tfplan.json` fails).

---

## Phase 3: Resolve

### Entry Criteria
- Merged findings exist.

### Actions
1. For each finding pick a row:

| Situation | Action |
|---|---|
| Fix is a config change with no behavior risk (encryption on, public access block) | Fix the code |
| Fix changes behavior (enables logging that costs money, blocks a public endpoint in use) | Ask the user, then fix or suppress |
| Control exists outside Terraform (org-level logging, SCP) | Suppress inline with that reason |
| Many legacy findings in code you are not changing | Baseline |

2. Inline suppression inside the resource block:
```
resource "aws_s3_bucket" "this" {
  # checkov:skip=CKV_AWS_18:Access logs collected by org-level CloudTrail data events
  bucket = var.name
}
```
3. Baseline: `checkov -d . --framework terraform --create-baseline` writes `.checkov.baseline`; later runs use `--baseline .checkov.baseline` and report only new findings. Commit the baseline and review it like code.
4. Never use `--soft-fail` in the gating CI job, and never add a check to `--skip-check` globally to clear one resource.

### Output
`checkov_findings`.

### Quality Gate
- Rerun of the Phase 1 command shows `Failed checks: 0`, or only findings covered by the committed baseline.
- Every `checkov:skip` line has text after the second colon.

---

## Worked Example

Illustrative. Repo with `modules/s3-bucket` and `live/dev/app`.

- Phase 1: summary `Passed checks: 41, Failed checks: 3, Skipped checks: 0`: CKV_AWS_18 (logging), CKV_AWS_144 (cross-region replication), CKV2_AWS_62 (event notifications).
- Phase 2: plan scan adds nothing new.
- Phase 3: CKV_AWS_18 suppressed (org CloudTrail data events); CKV_AWS_144 suppressed after the user confirms no replication requirement; CKV2_AWS_62 suppressed with reason "no consumers". Rerun: `Failed checks: 0, Skipped checks: 3`.

---

## Exit Criteria

DONE when source and plan scans show zero unresolved failures and every suppression carries a reason.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Private module download fails | **Adjust**: set git credentials or registry token; or scan with `--download-external-modules false` and note the gap. |
| Phase 2 | No credentials for a plan | **Return**: run the plan scan in CI where plan credentials exist. |
| Phase 3 | Fix would force replacement of a stateful resource | **Stop**: check the plan for "forces replacement" before applying; ask the user. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
