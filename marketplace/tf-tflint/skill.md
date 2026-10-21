# Lint Terraform with TFLint and a Cloud Ruleset

**One-line description:** Configures `.tflint.hcl` with the bundled terraform ruleset and the AWS, Google or AzureRM plugin, runs `tflint --recursive`, reads the compact output, and fixes or annotates each finding with a stated reason.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root module paths.
- `cloud` (string, required): `aws`, `gcp`, or `azure`; selects the plugin.
- `fmt_validate_report` (object, required): From `tf-fmt-validate`; lint only code that validates.

---

## Outputs

- `tflint_findings` (object[]): Each finding: rule name, severity, file, line, and resolution (fixed, or ignored with the annotation and reason).

---

## Phase 1: Configure

### Entry Criteria
- `fmt_validate_report` shows zero validate errors.
- `tflint --version` runs.

### Actions
1. Write `.tflint.hcl` at the repo root:
```
plugin "terraform" {
  enabled = true
  preset  = "recommended"
}

plugin "aws" {
  enabled = true
  version = "<latest release tag without v>"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}
```
2. Plugin by `cloud`:

| `cloud` | Plugin block name | `source` |
|---|---|---|
| aws | `aws` | `github.com/terraform-linters/tflint-ruleset-aws` |
| gcp | `google` | `github.com/terraform-linters/tflint-ruleset-google` |
| azure | `azurerm` | `github.com/terraform-linters/tflint-ruleset-azurerm` |

   Read the version from the plugin's GitHub releases page. Do not invent a version number.
3. Run `tflint --init` to download the plugin. In CI set `GITHUB_TOKEN` to avoid GitHub API rate limits during `--init`.
4. Optional rules beyond the preset (enable explicitly): `rule "terraform_naming_convention" { enabled = true }`, `rule "terraform_documented_variables" { enabled = true }`.

### Output
`.tflint.hcl` and installed plugins.

### Quality Gate
- `tflint --version` lists the cloud ruleset plugin with its version after `--init`.

---

## Phase 2: Run and Read

### Entry Criteria
- Plugins installed.

### Actions
1. From the repo root: `tflint --recursive --format compact`. `--recursive` runs in every directory with `.tf` files.
2. Read each compact line: `<file>:<line>:<col>: <Severity> - <message> (<rule_name>)`.
3. Common rules and what they mean:

| Rule | Meaning |
|---|---|
| `terraform_unused_declarations` | Variable, local or data source declared but never referenced |
| `terraform_typed_variables` | Variable without `type` |
| `terraform_required_version` / `terraform_required_providers` | Missing version constraints |
| `terraform_deprecated_interpolation` | `"${var.x}"` where `var.x` is enough |
| `aws_instance_invalid_type` | Instance type that does not exist |
| `aws_instance_previous_type` | Previous-generation instance type |

4. Use `tflint --format json` when a script needs to count findings; check `tflint --help` for the exit code behavior and failure severity flag of your version rather than assuming them.

### Output
Finding list.

### Quality Gate
- The tflint command ran in every root module directory (the compact output or JSON is recorded, even if empty).

---

## Phase 3: Resolve

### Entry Criteria
- Finding list exists.

### Actions
1. Fix findings in one file at a time; rerun `tflint --recursive --format compact` after each file.
2. If a finding is a deliberate choice, annotate the exact line above it with the rule name and a reason:
```
# tflint-ignore: aws_instance_previous_type # reserved instances run until 2027
instance_type = "m4.large"
```
3. Never disable a rule globally in `.tflint.hcl` to clear one finding. Never delete a variable flagged as unused without checking that no `-var-file` or CI step sets it (`grep -rn <name> .`).

### Output
`tflint_findings` with every item fixed or annotated.

### Quality Gate
- Final `tflint --recursive --format compact` prints no findings.
- `grep -rn 'tflint-ignore' --include='*.tf' .` lines each include a reason after the rule name.

---

## Worked Example

Illustrative. `cloud = aws`, repo with `live/dev/app`.

- Phase 1: `.tflint.hcl` with aws plugin; `tflint --init` prints "Installing \"aws\" plugin...".
- Phase 2: output:
```
live/dev/app/main.tf:12:19: Error - "t2.mega" is an invalid value as instance_type (aws_instance_invalid_type)
live/dev/app/variables.tf:30:1: Warning - variable "legacy_ami" is declared but not used (terraform_unused_declarations)
```
- Phase 3: instance type fixed to the intended `t3.medium` after checking with the user; `grep -rn legacy_ami .` finds nothing else, so the variable is removed. Rerun prints nothing.

---

## Exit Criteria

DONE when tflint with the cloud ruleset reports no unannotated findings in every module.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `--init` hits GitHub rate limit | **Retry**: with `GITHUB_TOKEN` set. |
| Phase 2 | "Failed to check ruleset" / module not found | **Adjust**: run `terraform init -backend=false` in that directory first; tflint reads installed modules. |
| Phase 3 | Fix would change live infrastructure (instance type) | **Stop**: confirm the intended value with the user; the change will show in the next plan. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
