# Pin Terraform and Provider Versions with a Multi-Platform Lock File

**One-line description:** Writes `required_version` and `required_providers` constraints with the right operator for root versus child modules, generates a `.terraform.lock.hcl` with hashes for every platform that runs Terraform, and proves CI installs exactly the locked versions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root module paths from `tf-repo-layout`.
- `terraform_version` (string, optional): Exact Terraform CLI version the team standardizes on, for example `1.9.8`. Default: the output of `terraform version` on the machine running this flow.
- `lock_platforms` (string[], optional): Platforms that run `terraform init`, for example `["linux_amd64", "darwin_arm64", "windows_amd64"]`. Default: `linux_amd64` plus the current machine.

---

## Outputs

- `version_constraints` (object): Per module, the `required_version` line and each provider's `source` and `version` constraint.
- `lock_file_report` (object): Per root module, the provider versions in `.terraform.lock.hcl` and the platforms covered by its hashes.

---

## Phase 1: Write Constraints

### Entry Criteria
- `terraform version` runs and prints a version.

### Actions
1. Run `terraform version -json` and record `terraform_version`.
2. Use this table for constraint operators:

| Module kind | `required_version` | Provider `version` |
|---|---|---|
| Root module (`live/...`) | `"~> 1.9.0"` style: patch updates only | `"~> 5.0"` style: minor updates within one major |
| Reusable child module (`modules/...`) | `">= 1.5"` style: lowest version whose features you use | `">= 5.0"` style: lowest major you tested; never an upper bound unless a known break |

   `~> 1.9.0` allows 1.9.x only. `~> 5.0` allows 5.x but not 6.0. Pick the numbers from the version you run, never from memory.
3. Write `versions.tf` in every module:
```
terraform {
  required_version = "~> 1.9.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```
   Every provider needs an explicit `source`. A missing `source` makes Terraform assume `hashicorp/<name>`, which is wrong for partner providers such as `integrations/github` or `cloudflare/cloudflare`.
4. If the team uses tfenv or tfswitch, also write `.terraform-version` with the exact version in the repo root.

### Output
`versions.tf` in every module and `version_constraints`.

### Quality Gate
- `grep -L required_version $(find . -name versions.tf)` prints nothing (every versions.tf has one).
- `terraform providers` in each root module lists no provider with source `registry.terraform.io/hashicorp/<x>` where `<x>` is a partner provider.

---

## Phase 2: Generate the Lock File for All Platforms

### Entry Criteria
- Constraints written.

### Actions
1. In each root module run `terraform init -input=false -backend=false`. This creates `.terraform.lock.hcl` with hashes only for the current platform.
2. Add hashes for every platform that will run init:
```
terraform providers lock -platform=linux_amd64 -platform=darwin_arm64 -platform=windows_amd64
```
   Without this, CI on Linux fails with an error saying the provider package doesn't match any of the checksums previously recorded in the dependency lock file.
3. Read the lock file. Each `provider` block has `version`, `constraints`, and `hashes`. `h1:` hashes are per platform package; `zh:` hashes come from the registry's signed checksum list for all platforms.
4. Commit `.terraform.lock.hcl`. Do not edit it by hand.
5. To change a locked version later, run `terraform init -upgrade` and commit the resulting diff. Plain `terraform init` never upgrades locked providers.

### Output
Committed lock files and `lock_file_report`.

### Quality Gate
- `git ls-files '*/.terraform.lock.hcl'` lists one file per root module.
- In a clean clone on Linux (or a `hashicorp/terraform` container), `terraform init -input=false -backend=false` exits 0 and does not modify the lock file (`git status --porcelain` shows no change to it).

---

## Phase 3: Pin the CLI in CI

### Entry Criteria
- Lock files committed.

### Actions
1. GitHub Actions: `hashicorp/setup-terraform` with `terraform_version: <exact version>`. GitLab: image `hashicorp/terraform:<exact version>` with `entrypoint: [""]`.
2. Add a CI step `terraform version` and fail the job if its first line does not contain the pinned version.
3. Add `terraform init -input=false -lockfile=readonly` in CI. With `-lockfile=readonly`, init fails instead of updating the lock file when the constraints and the lock file disagree.

### Output
CI pinned to the exact CLI version with a read-only lock file.

### Quality Gate
- CI log shows `terraform version` printing the pinned version.
- CI log shows init with `-lockfile=readonly` exiting 0.

---

## Worked Example

Illustrative. `terraform version -json` prints `"terraform_version": "1.9.8"`. Root `live/prod/network/versions.tf` gets `required_version = "~> 1.9.0"` and aws `version = "~> 5.0"`. After `terraform providers lock -platform=linux_amd64 -platform=darwin_arm64`, the lock file shows:
```
provider "registry.terraform.io/hashicorp/aws" {
  version     = "5.74.0"
  constraints = "~> 5.0"
  hashes = [ "h1:...", "h1:...", "zh:...", ... ]
}
```
`lock_file_report` records aws 5.74.0 for linux_amd64 and darwin_arm64.

---

## Exit Criteria

DONE when every module has constraints per the table, every root module has a committed multi-platform lock file, and CI installs the pinned CLI with a read-only lock file.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Module needs a feature newer than the pinned CLI | **Adjust**: raise `required_version` to the release that added the feature, cited from the Terraform changelog. |
| Phase 2 | `providers lock` fails with a network error | **Retry**: once; if a private mirror is used, add `-fs-mirror` or `-net-mirror` per `terraform providers lock -help`. |
| Phase 2 | Checksum mismatch in CI | **Adjust**: rerun `terraform providers lock` with the CI platform included and commit. Never delete the lock file to make CI pass. |
| Phase 3 | `-lockfile=readonly` fails after a constraint change | **Return**: run `terraform init -upgrade` locally, commit the lock diff, rerun CI. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
