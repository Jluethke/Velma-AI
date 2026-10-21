# Design a Reusable Terraform Module Interface

**One-line description:** Builds one child module with a typed, validated input surface (object types with `optional()` defaults), stable outputs, no provider blocks, a pinned source reference for callers, and a generated README.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_layout` (object, required): Layout from `tf-repo-layout` (where `modules/` lives).
- `module_name` (string, required): Directory name under `modules/`, for example `s3-bucket` or `vpc`.
- `module_purpose` (string, required): One sentence naming what the module creates and what it deliberately does not.

---

## Outputs

- `module_interface` (object): Every variable (name, type, default, validation) and every output (name, value expression, sensitive) of the module.
- `module_files` (string[]): Paths of the files written: `main.tf`, `variables.tf`, `outputs.tf`, `versions.tf`, `README.md`.

---

## Phase 1: Define the Boundary

### Entry Criteria
- `modules/<module_name>` does not exist, or exists and you were asked to redesign it.

### Actions
1. Write the module's resource list from `module_purpose`. A module wraps one concept (a bucket with its policy, encryption and logging) not a whole environment.
2. Apply these rules and record each decision:

| Question | Rule |
|---|---|
| Does the module need a provider configuration? | Declare it in `required_providers` only. Never write a `provider` block in a child module. |
| Needs two configurations of one provider (two regions)? | `configuration_aliases = [aws.replica]` in `required_providers`; caller passes `providers = { aws.replica = aws.usw2 }`. |
| Should it create its own networking, IAM role, KMS key? | Accept the ID as an input when callers usually already have one; create it only behind a boolean input. |
| Value differs per environment | Input variable |
| Value is a team-wide fixed policy (encryption on) | Hard-code it in the module, not an input |

3. Do not wrap a single resource with no added policy in a module; call the resource directly.

### Output
Resource list and decision table.

### Quality Gate
- Every row of the decision table has a recorded answer.
- The resource list has no `provider` block entry.

---

## Phase 2: Write Typed Inputs

### Entry Criteria
- Boundary recorded.

### Actions
1. Every variable has `type` and `description`. Never leave `type` unset (it becomes `any`).
2. Group related settings in an object with `optional()` (Terraform 1.3+):
```
variable "lifecycle_rules" {
  description = "Expiration rules for the bucket."
  type = list(object({
    id              = string
    prefix          = optional(string, "")
    expiration_days = number
  }))
  default = []
}
```
3. Add `validation` blocks for every constraint the cloud API would reject later:
```
variable "name" {
  type        = string
  description = "Bucket name."
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.name))
    error_message = "name must be 3-63 chars, lowercase letters, digits, dots, hyphens (S3 naming rules)."
  }
}
```
   Take the rule from the provider or cloud documentation and cite it in `error_message`. Since Terraform 1.9 a validation condition may reference other variables; on older versions it may reference only its own variable.
4. Set `nullable = false` on variables where `null` must not override the default.
5. Mark secret inputs `sensitive = true`.
6. Write `versions.tf` with lower-bound constraints only (see `tf-version-pinning`).

### Output
`variables.tf`, `versions.tf`.

### Quality Gate
- `grep -c 'variable "' variables.tf` equals `grep -c 'type *=' variables.tf` (rough check that each variable has a type; then confirm by reading).
- `terraform init -backend=false && terraform validate` in the module directory prints "Success! The configuration is valid."

---

## Phase 3: Outputs, Docs and Caller Pinning

### Entry Criteria
- Inputs valid.

### Actions
1. Output identifiers callers need (`id`, `arn`, `name`), not whole resource objects. Whole objects make every attribute part of the contract.
2. Any output derived from a sensitive value must be `sensitive = true`, or Terraform errors with "Output refers to sensitive values".
3. Generate docs: `terraform-docs markdown table --output-file README.md --output-mode inject .` (needs `<!-- BEGIN_TF_DOCS -->` and `<!-- END_TF_DOCS -->` markers in README.md for inject mode).
4. Callers pin the module source:
   - Git: `source = "git::https://github.com/acme/tf-modules.git//s3-bucket?ref=v1.4.0"` (tag, never a branch).
   - Registry: `source = "acme/s3-bucket/aws"` with `version = "~> 1.4"`.
   - Same repo: `source = "../../modules/s3-bucket"` (no version; it moves with the commit).
5. Breaking changes to variable names or output names need a new major tag; renamed resources inside the module need `moved` blocks (see `tf-moved-refactor`).

### Output
`module_interface`, `module_files`.

### Quality Gate
- `terraform-docs markdown table . | diff - <(sed -n '/BEGIN_TF_DOCS/,/END_TF_DOCS/p' README.md | sed '1d;$d')` shows no difference, or simply rerunning the inject command produces no git diff.
- `grep -n 'provider "' *.tf` in the module prints nothing.

---

## Worked Example

Illustrative. `module_name = s3-bucket`, purpose "private, encrypted, versioned bucket with optional lifecycle rules; does not create KMS keys".

- Phase 1: KMS key accepted as input `kms_key_arn` (callers already have one). Encryption and public access block hard-coded on.
- Phase 2: variables `name` (validated), `kms_key_arn`, `lifecycle_rules`, `tags`. `terraform validate` prints "Success! The configuration is valid."
- Phase 3: outputs `bucket_id`, `bucket_arn`. README generated. Callers use `?ref=v1.0.0`.

---

## Exit Criteria

DONE when the module validates, has typed and validated inputs, identifier outputs, no provider blocks, a generated README, and callers have a pinned source pattern.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Purpose covers several unrelated concepts | **Adjust**: split into one module per concept. |
| Phase 2 | Validation references another variable on Terraform older than 1.9 | **Adjust**: move the cross-variable check to a `precondition` on a resource. |
| Phase 3 | "Output refers to sensitive values" | **Adjust**: add `sensitive = true`; do not wrap with `nonsensitive()` to silence it. |
| Phase 3 | terraform-docs not installed | **Adjust**: install from its GitHub releases or `brew install terraform-docs`; do not hand-write the table. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
