# Import Existing Cloud Resources with import Blocks

**One-line description:** Adopts resources created outside Terraform using config-driven `import` blocks (Terraform 1.5+) and `terraform plan -generate-config-out`, finds the correct import ID format per resource type, cleans the generated HCL, and proves adoption with a plan that imports and changes nothing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root module that will own the imported resources (one per run).
- `cloud` (string, required): `aws`, `gcp`, or `azure`.
- `import_targets` (object[], required): Each: intended Terraform address (for example `aws_s3_bucket.logs`) and cloud identifier (name, ID, or ARN).

---

## Outputs

- `import_blocks` (object[]): Each `import` block written: `to`, `id`, and the final resource configuration file.
- `import_plan_summary` (string): The plan summary line after cleanup, for example `Plan: 3 to import, 0 to add, 0 to change, 0 to destroy.`

---

## Phase 1: Find IDs

### Entry Criteria
- `terraform version` is 1.5 or later (`import` blocks and `-generate-config-out`). Older CLIs use `terraform import <address> <id>` one at a time.
- The resource is not already in any state: `terraform state list | grep <address>` prints nothing, in every root that could own it.

### Actions
1. Discover candidates if the user has no list: `aws resourcegroupstaggingapi get-resources --tag-filters Key=team,Values=<team>`; `gcloud asset search-all-resources --scope=projects/<project>`; `az resource list --resource-group <rg> -o table`.
2. For each target, open the resource page on the Terraform Registry for your provider version and scroll to the **Import** section at the bottom. It states the ID format. Never guess the format. Common examples:

| Resource | ID format |
|---|---|
| `aws_s3_bucket` | bucket name |
| `aws_instance` | instance ID `i-...` |
| `aws_iam_role` | role name |
| `aws_security_group` | `sg-...` |
| `google_storage_bucket` | bucket name or `<project>/<bucket>` |
| `google_compute_instance` | `projects/<project>/zones/<zone>/instances/<name>` |
| `azurerm_resource_group` | full ID `/subscriptions/<sub>/resourceGroups/<name>` |

3. Importing one resource that the provider splits into several (an S3 bucket plus its versioning, encryption, policy) needs one import per Terraform resource. List them all.

### Output
Target table with verified ID formats.

### Quality Gate
- Every target has the Registry Import section cited for its ID format.
- `terraform state list` in every candidate root shows none of the targets.

---

## Phase 2: Generate and Clean Config

### Entry Criteria
- IDs verified.

### Actions
1. Write `imports.tf`:
```
import {
  to = aws_s3_bucket.logs
  id = "acme-logs-prod"
}
```
   For many similar resources on Terraform 1.7+, use `for_each` in the import block with a map, and the same keys on the resource.
2. Do not write the resource block yet. Run:
```
terraform plan -input=false -generate-config-out=generated.tf
```
   Terraform writes HCL for every import target that has no resource block. The file must not already exist.
3. Clean `generated.tf`, one resource at a time:
   - Remove arguments that conflict or are computed (validate tells you: "Conflicting configuration arguments", "Invalid or unknown key").
   - Replace literal IDs of other managed resources with references (`vpc_id = aws_vpc.main.id`).
   - Replace literals that differ per environment with variables.
4. Move each cleaned resource into the proper file (`main.tf` or the module file) and delete `generated.tf`.

### Output
Clean resource blocks plus `import` blocks.

### Quality Gate
- `terraform validate` prints "Success!".
- `ls generated.tf` fails (file removed after moving its contents).

---

## Phase 3: Plan, Apply, Clean Up

### Entry Criteria
- Config validates.

### Actions
1. `terraform plan -input=false -out=tfplan`. The goal summary is `Plan: N to import, 0 to add, 0 to change, 0 to destroy.`
2. Read each `will be imported` entry. If it also says `will be updated in-place`, the config differs from reality: edit the config to match reality (adoption must not change the resource), then re-plan.
3. Any `to add` or `to destroy` count above 0 is a failure: an address or ID is wrong.
4. `terraform apply tfplan`.
5. Run `terraform plan -detailed-exitcode`; exit code 0.
6. Remove the `import` blocks in a follow-up commit (they are no-ops once applied; keeping them in reusable modules is an error).

### Output
`import_blocks`, `import_plan_summary`.

### Quality Gate
- Recorded summary line shows `0 to add, 0 to change, 0 to destroy` before apply.
- Post-apply plan exit code 0.

---

## Worked Example

Illustrative. `cloud = aws`; targets: bucket `acme-logs-prod` and its versioning configuration.

- Phase 1: Registry says `aws_s3_bucket` imports by bucket name and `aws_s3_bucket_versioning` by bucket name too.
- Phase 2: two import blocks; `terraform plan -generate-config-out=generated.tf` prints "Terraform has generated configuration and written it to generated.tf". Validate first fails on a computed argument; removed. `bucket` in the versioning resource replaced with `aws_s3_bucket.logs.id`.
- Phase 3: plan prints `Plan: 2 to import, 0 to add, 0 to change, 0 to destroy.` Apply prints `Apply complete! Resources: 2 imported, 0 added, 0 changed, 0 destroyed.` Re-plan exit 0.

---

## Exit Criteria

DONE when every target is in state, the post-import plan is clean, and import blocks and generated files are removed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Resource already managed in another state | **Stop**: two states must never own one resource; use `tf-state-surgery` to move it instead. |
| Phase 2 | "Cannot import non-existent remote object" | **Adjust**: wrong ID format or wrong region/project; recheck the Registry Import section and provider config. |
| Phase 2 | Generated config fails validate repeatedly | **Adjust**: write the resource block by hand from the docs using `terraform state show` output after a plain import, one attribute at a time. |
| Phase 3 | Plan shows `to destroy` | **Stop**: do not apply; an existing resource address collides with the import target. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
