# Terraform Plan and Apply Gating in GitHub Actions

**One-line description:** Builds GitHub Actions workflows that run fmt, validate, lint and plan on pull requests with a read-only OIDC role, then on merge plan again, wait for a protected Environment approval, and apply exactly the saved plan with a write role, serialized per root module.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root modules the workflows cover.
- `env_strategy` (object, required): From `tf-env-strategy`; init and plan commands per environment.
- `cloud` (string, required): `aws`, `gcp`, or `azure`; selects the OIDC login action.
- `destroy_guard_config` (object, required): From `tf-destroy-safeguards`; forbidden commands and the guard script.

---

## Outputs

- `ci_workflow_files` (string[]): Paths of workflow files written, for example `.github/workflows/terraform-pr.yml` and `.github/workflows/terraform-apply.yml`.
- `ci_gate_matrix` (object): For each gate (fmt, validate, tflint, security scan, conftest, plan, approval, apply), the job name, the command, and what failure blocks.

---

## Phase 1: Identity and Repository Settings

### Entry Criteria
- Repository admin access; a cloud identity provider for GitHub OIDC can be created.

### Actions
1. Create two cloud identities per environment: PLAN (read-only plus state read and lock write) and APPLY (write).
2. Trust conditions on the OIDC subject claim (`token.actions.githubusercontent.com:sub`):

| Identity | Subject condition |
|---|---|
| PLAN | `repo:<org>/<repo>:pull_request` and `repo:<org>/<repo>:ref:refs/heads/main` |
| APPLY | `repo:<org>/<repo>:environment:<env>` only |

   Because APPLY trusts only the environment subject, a pull request job cannot assume it.
3. In repo Settings, Environments: create `<env>` (for example `production`) with Required reviewers and a deployment branch rule of `main`.
4. Branch protection on `main`: require the PR workflow's status checks.

### Output
Identities and environments.

### Quality Gate
- The APPLY role's trust policy contains only the `environment:` subject (paste the policy JSON condition).
- The environment shows Required reviewers in Settings.

---

## Phase 2: Pull Request Workflow

### Entry Criteria
- Identities exist.

### Actions
1. `.github/workflows/terraform-pr.yml`:
```
name: terraform-pr
on:
  pull_request:
    paths: ["live/**", "modules/**"]
permissions:
  id-token: write
  contents: read
  pull-requests: write
jobs:
  plan:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        dir: [live/prod/network, live/prod/app]
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.9.8
          terraform_wrapper: false
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/tf-plan-prod
          aws-region: us-east-1
      - run: sh ci/forbid-destroy.sh
      - run: terraform fmt -check -recursive
      - run: terraform -chdir=${{ matrix.dir }} init -input=false -lockfile=readonly
      - run: terraform -chdir=${{ matrix.dir }} validate
      - run: terraform -chdir=${{ matrix.dir }} plan -input=false -lock-timeout=5m -out=tfplan
      - run: terraform -chdir=${{ matrix.dir }} show -no-color tfplan >> "$GITHUB_STEP_SUMMARY"
```
2. Login step by `cloud`:

| `cloud` | Action | Key inputs |
|---|---|---|
| aws | `aws-actions/configure-aws-credentials@v4` | `role-to-assume`, `aws-region` |
| gcp | `google-github-actions/auth@v2` | `workload_identity_provider`, `service_account` |
| azure | `azure/login@v2` | `client-id`, `tenant-id`, `subscription-id`; plus env `ARM_USE_OIDC: "true"`, `ARM_CLIENT_ID`, `ARM_TENANT_ID`, `ARM_SUBSCRIPTION_ID` for the provider |

3. Add tflint, Checkov or Trivy, and conftest steps from their flows after plan.
4. Pin action major versions as shown or by commit SHA if the org requires it. Pin `terraform_version` to the value from `tf-version-pinning`. `terraform_wrapper: false` keeps exit codes and stdout clean for scripts.
5. Plans from forks: `pull_request` from forks gets no OIDC token for secrets-bearing roles; do not switch to `pull_request_target` to get one, because that runs untrusted code with privileges.

### Output
PR workflow file.

### Quality Gate
- `actionlint .github/workflows/terraform-pr.yml` exits 0 (install from its GitHub releases if missing).
- A test pull request shows the plan in the job summary and the check is required on `main`.

---

## Phase 3: Apply Workflow

### Entry Criteria
- PR workflow works.

### Actions
1. `.github/workflows/terraform-apply.yml` on `push` to `main`, two jobs per root: `plan` (PLAN role, uploads the plan) and `apply` (APPLY role, `environment: production`, `needs: plan`):
```
  apply:
    needs: plan
    runs-on: ubuntu-latest
    environment: production
    concurrency:
      group: tf-${{ matrix.dir }}-production
      cancel-in-progress: false
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with: { terraform_version: 1.9.8, terraform_wrapper: false }
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/tf-apply-prod
          aws-region: us-east-1
      - uses: actions/download-artifact@v4
        with: { name: tfplan-${{ matrix.name }}, path: ${{ matrix.dir }} }
      - run: terraform -chdir=${{ matrix.dir }} init -input=false -lockfile=readonly
      - run: terraform -chdir=${{ matrix.dir }} apply -input=false tfplan
```
   Both jobs use the same matrix written as `include:` entries with a `dir` and a slash-free `name` (for example `{dir: live/prod/app, name: prod-app}`), because artifact names cannot contain `/`. The plan job uploads `${{ matrix.dir }}/tfplan` with `actions/upload-artifact@v4` under `tfplan-${{ matrix.name }}` and a short `retention-days`. The plan file contains sensitive values; keep the repository private or encrypt the artifact.
2. The reviewer approves the Environment after reading the plan job's summary. The apply job applies that exact file; if state changed meanwhile, Terraform rejects the stale plan and the run must be repeated.
3. `concurrency` with `cancel-in-progress: false` queues applies per root instead of cancelling one mid-apply.
4. No `-auto-approve` anywhere: applying a saved plan file does not prompt.

### Output
`ci_workflow_files`, `ci_gate_matrix`.

### Quality Gate
- `actionlint` exits 0 on both files.
- `sh ci/forbid-destroy.sh` exits 0.
- A merged test change shows the apply job waiting for review, then `Apply complete!` in its log.

---

## Worked Example

Illustrative. `cloud = aws`, roots `live/prod/network` and `live/prod/app`.

- Phase 1: roles `tf-plan-prod` (subject `pull_request` and `ref:refs/heads/main`) and `tf-apply-prod` (subject `environment:production`). Environment `production` with two required reviewers.
- Phase 2: PR shows plan for both roots in the summary; network shows "No changes.", app shows `Plan: 0 to add, 1 to change, 0 to destroy.`
- Phase 3: after merge, apply for app waits "Waiting for review: production needs approval"; after approval, log ends `Apply complete! Resources: 0 added, 1 changed, 0 destroyed.`

---

## Exit Criteria

DONE when PRs run all gates with a read-only identity, merges apply only the reviewed saved plan after Environment approval with a write identity, and applies are serialized per root.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | "Not authorized to perform sts:AssumeRoleWithWebIdentity" | **Adjust**: compare the job's subject claim with the trust condition; environment jobs use `environment:<name>`, not the branch. |
| Phase 2 | Init fails on lock file checksum | **Return**: run `tf-version-pinning` Phase 2 with `linux_amd64`. |
| Phase 3 | "Saved plan is stale" | **Retry**: rerun the workflow; plan and apply run again in order. |
| Phase 3 | Apply job cancelled mid-run | **Stop**: check for a held state lock and partial changes; re-plan before anything else. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
