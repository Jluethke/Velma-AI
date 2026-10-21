# Misconfiguration Scan with Trivy (tfsec Successor)

**One-line description:** Scans Terraform with `trivy config` (the maintained successor of tfsec), filters by severity, passes tfvars so values resolve, reads the AVD check IDs, and suppresses with `trivy:ignore` comments or `.trivyignore` only with reasons; covers legacy `tfsec` where it is still in CI.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root module paths.
- `fmt_validate_report` (object, required): From `tf-fmt-validate`.

---

## Outputs

- `trivy_findings` (object[]): Each finding: check ID, severity, resource, file and line, resolution.

---

## Phase 1: Scan

### Entry Criteria
- Validate passes. `trivy --version` runs.

### Actions
1. tfsec's checks were moved into Trivy, and Aqua directs tfsec users to Trivy. New pipelines use Trivy. If CI already runs `tfsec`, keep it until Trivy is in place, then remove it.
2. Scan each root module with its values:
```
trivy config --severity HIGH,CRITICAL --tf-vars live/prod/app/terraform.tfvars live/prod/app
```
   Without `--tf-vars`, conditions that depend on variables may be evaluated as unknown.
3. Full repo, all severities, JSON for tooling: `trivy config --format json --output trivy.json .` (store outside the repo).
4. Gating form for CI: add `--exit-code 1` so findings at the selected severities fail the job.
5. Read each finding: the header shows the check ID (copy it exactly as printed, for example `AVD-AWS-0089`), title, severity, then the file, line range and code snippet, then a link to the check documentation.
6. Legacy tfsec equivalent: `tfsec . --minimum-severity HIGH` (check `tfsec --help` for flags in the installed version).

### Output
Finding list per root module.

### Quality Gate
- The summary table at the end of the run (Tests, Successes, Failures by severity) is recorded for each scanned directory.

---

## Phase 2: Resolve

### Entry Criteria
- Finding list exists.

### Actions
1. Fix the code where the fix has no behavior risk. Ask the user where it changes behavior (opening or closing network paths, enabling costly logging).
2. Inline suppression on the line above the resource, with the ID exactly as printed:
```
#trivy:ignore:AVD-AWS-0089 Access logging handled by the org log archive account
resource "aws_s3_bucket" "this" {
```
   Legacy tfsec form: `#tfsec:ignore:aws-s3-enable-bucket-logging`. Trivy also honors many tfsec ignore comments; verify by rerunning.
3. File-wide exceptions go in `.trivyignore` at the scan root, one ID per line, with a `#` comment line above each giving the reason.
4. Never lower `--severity` or drop `--exit-code 1` in CI to get a green run.
5. Rerun the Phase 1 command after each file you change.

### Output
`trivy_findings` with resolutions.

### Quality Gate
- The gating command `trivy config --severity HIGH,CRITICAL --exit-code 1 <dir>` exits 0 for every root module (`echo $?` prints 0).
- Every ignore comment and `.trivyignore` entry has a reason.

---

## Worked Example

Illustrative. `live/prod/app` with an internet-facing security group.

- Phase 1: `trivy config --severity HIGH,CRITICAL --tf-vars live/prod/app/terraform.tfvars live/prod/app` reports `AVD-AWS-0107 (HIGH): Security group rule allows ingress from public internet` at `main.tf:40-48`.
- Phase 2: the rule is an ALB on 443 and is meant to be public; the user confirms. Line above the rule: `#trivy:ignore:AVD-AWS-0107 Public HTTPS ALB by design, WAF attached`. Rerun with `--exit-code 1`; `echo $?` prints 0.

---

## Exit Criteria

DONE when every root module passes the gating Trivy command and each suppression has a reason.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Check IDs differ from older docs | **Adjust**: always copy the ID from the current output; IDs and prefixes have changed across releases. |
| Phase 1 | Remote modules not scanned | **Adjust**: run `terraform init` first so `.terraform/modules` exists; rerun. |
| Phase 2 | Ignore comment not honored | **Retry**: place it on the line directly above the resource or attribute; confirm the ID spelling; rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
