# Upgrade One Provider Major Version with a Zero-Diff Plan

**One-line description:** Upgrades a single provider (for example hashicorp/aws 4.x to 5.x) in one root module at a time by reading the official upgrade guide, widening the constraint, running `terraform init -upgrade`, and editing config until the plan shows no unintended changes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root modules that use the provider; upgraded one at a time.
- `version_constraints` (object, required): From `tf-version-pinning`; current constraints and locked versions.
- `provider_source` (string, required): Provider source address, for example `hashicorp/aws`.
- `target_provider_version` (string, required): Target version or constraint, for example `~> 5.0`.

---

## Outputs

- `provider_upgrade_report` (object): Per root module: old and new locked version, config edits made with the upgrade-guide section that required each, and the final plan summary line.

---

## Phase 1: Read Before Changing

### Entry Criteria
- The current plan for the root module is clean: `terraform plan -detailed-exitcode` exits 0. Never upgrade on top of pending changes; you cannot tell which diff came from the upgrade.

### Actions
1. Record the current locked version: `grep -A2 'provider "registry.terraform.io/<provider_source>"' .terraform.lock.hcl`.
2. Open the provider's upgrade guide on the Terraform Registry (for hashicorp/aws: "Terraform AWS Provider Version 5 Upgrade Guide") and its CHANGELOG between the old and new versions.
3. Grep the root module and every module it calls for each removed or renamed item the guide lists. Example for aws 5: `grep -rn 'acl *=' --include='*.tf' .` (bucket ACL moved to separate resources in v4), removed data sources, renamed arguments.
4. Write the list: item, file:line, guide section.
5. If reusable child modules constrain the provider with an upper bound (`< 5.0`), they must be updated first; a root cannot install a version a child forbids.

### Output
Impact list.

### Quality Gate
- Baseline plan exit code 0 is recorded.
- Every guide item that matches the code appears in the impact list with file:line.

---

## Phase 2: Upgrade and Fix

### Entry Criteria
- Impact list exists.

### Actions
1. Change the constraint in the root's `versions.tf` to `target_provider_version`. Change nothing else yet.
2. Run `terraform init -upgrade -input=false`. Confirm the new version: `terraform providers` and the lock file diff (`git diff .terraform.lock.hcl`).
3. Run `terraform validate`. Fix errors in the order printed, one file at a time, each fix matched to an impact list item.
4. Run `terraform plan -input=false -out=tfplan`. Classify every change:

| Plan line | Meaning | Action |
|---|---|---|
| `~ update in-place` on a default value the guide says changed | Provider default changed | Set the old value explicitly if the old behavior is wanted |
| `-/+ ... # forces replacement` | Replacement | **Stop** and fix config; never apply a replacement caused by an upgrade without user approval |
| Attribute moved to a new resource (plan creates a new `aws_s3_bucket_*` resource) | Split resource | Add an `import` block for the new resource so it is adopted, not created (see `tf-import-existing`) |
| No changes | Done | Proceed |

5. Repeat until `terraform plan -detailed-exitcode` exits 0 or every remaining change is approved by the user.
6. Regenerate multi-platform hashes: `terraform providers lock -platform=linux_amd64 -platform=darwin_arm64` (match your `lock_platforms`).

### Output
Upgraded root module.

### Quality Gate
- `terraform providers` shows the target version.
- Final plan exit code 0, or every listed change has written user approval in the report.
- Plan contains no `forces replacement` line.

---

## Phase 3: Roll Out

### Entry Criteria
- First root module upgraded in a non-production environment and applied.

### Actions
1. Apply the saved plan in the lowest environment: `terraform apply tfplan`.
2. Repeat Phases 1 and 2 for the next root module. Do not batch all roots in one pull request; one root (or one environment) per pull request keeps review readable.
3. Production last.

### Output
`provider_upgrade_report`.

### Quality Gate
- The report has one entry per root module with old version, new version and final plan line.

---

## Worked Example

Illustrative. `live/dev/app`, `hashicorp/aws` 4.67.0 to `~> 5.0`.

- Phase 1: baseline plan exit 0. Guide lists removal of some deprecated attributes; grep finds none in use. One child module pins `>= 4.0, < 5.0`; it gets a new tag allowing 5.x first.
- Phase 2: `terraform init -upgrade` installs 5.x. Plan shows `~ update in-place` on one resource where a default changed; the old value is set explicitly. Rerun: "No changes." Exit code 0.
- Phase 3: applied in dev, then staging, then prod in separate pull requests.

---

## Exit Criteria

DONE when every listed root module runs the target provider version with a clean plan and committed multi-platform lock file.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Baseline plan not clean | **Stop**: apply or revert pending changes first. |
| Phase 2 | "no available releases match the given constraints" | **Adjust**: a child module's constraint blocks it; update that module first. |
| Phase 2 | Plan shows replacement | **Stop**: find the guide item; fix config; if no in-place path exists, report to the user. |
| Phase 3 | Apply fails mid-way | **Return**: read the error; the state is consistent per resource; fix and re-plan. Do not downgrade the provider after state was written by the newer version without checking the provider's downgrade notes. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
