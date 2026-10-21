# Terraform Plan and Apply Gating in GitLab CI

**One-line description:** Builds a `.gitlab-ci.yml` with validate, plan and manual apply stages using a pinned `hashicorp/terraform` image, OIDC `id_tokens` for cloud login, plan artifacts with the GitLab Terraform report, protected environments for approval, and `resource_group` to serialize applies.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root modules the pipeline covers.
- `env_strategy` (object, required): From `tf-env-strategy`.
- `cloud` (string, required): `aws`, `gcp`, or `azure`.
- `destroy_guard_config` (object, required): From `tf-destroy-safeguards`.

---

## Outputs

- `ci_workflow_files` (string[]): `.gitlab-ci.yml` and any included files.
- `ci_gate_matrix` (object): Each gate: job name, stage, command, what failure blocks.

---

## Phase 1: Identity and Project Settings

### Entry Criteria
- Maintainer access to the GitLab project.

### Actions
1. Create cloud trust for GitLab OIDC (issuer `https://gitlab.com` or your self-managed URL). Restrict on the `sub` claim, for example `project_path:<group>/<project>:ref_type:branch:ref:main` for the apply identity. Plan identities may trust merge request pipelines too.
2. Settings, CI/CD, Variables: store role ARNs or identity IDs (not secrets themselves); mark protected so only protected branches see the apply identity.
3. Operate, Environments: create `production`; protect it (Settings, CI/CD, Protected environments) with allowed deployers and, where the tier offers it, required approvals.
4. Protect `main` and require the pipeline to pass before merge.

### Output
Identities and protected environment.

### Quality Gate
- The apply identity's trust condition names `ref:main` (paste it).
- `production` appears under Protected environments.

---

## Phase 2: Pipeline File

### Entry Criteria
- Settings done.

### Actions
1. `.gitlab-ci.yml`:
```
stages: [validate, plan, apply]

default:
  image:
    name: hashicorp/terraform:1.9.8
    entrypoint: [""]

variables:
  TF_DIR: live/prod/app
  TF_IN_AUTOMATION: "true"

.aws_oidc:
  id_tokens:
    AWS_ID_TOKEN:
      aud: https://gitlab.com
  before_script:
    - echo "$AWS_ID_TOKEN" > /tmp/web_identity_token
    - export AWS_WEB_IDENTITY_TOKEN_FILE=/tmp/web_identity_token
    - export AWS_ROLE_ARN="$TF_PLAN_ROLE_ARN"

validate:
  stage: validate
  script:
    - sh ci/forbid-destroy.sh
    - terraform fmt -check -recursive
    - terraform -chdir=$TF_DIR init -input=false -backend=false -lockfile=readonly
    - terraform -chdir=$TF_DIR validate

plan:
  stage: plan
  extends: .aws_oidc
  script:
    - terraform -chdir=$TF_DIR init -input=false -lockfile=readonly
    - terraform -chdir=$TF_DIR plan -input=false -lock-timeout=5m -out=tfplan
    - terraform -chdir=$TF_DIR show -json tfplan | jq -r '([.resource_changes[]?.change.actions?]|flatten)|{"create":(map(select(.=="create"))|length),"update":(map(select(.=="update"))|length),"delete":(map(select(.=="delete"))|length)}' > plan-report.json
  artifacts:
    paths: [$TF_DIR/tfplan]
    reports:
      terraform: plan-report.json
    expire_in: 1 day

apply:
  stage: apply
  extends: .aws_oidc
  needs: [plan]
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual
  environment:
    name: production
  resource_group: tf-prod-app
  before_script:
    - echo "$AWS_ID_TOKEN" > /tmp/web_identity_token
    - export AWS_WEB_IDENTITY_TOKEN_FILE=/tmp/web_identity_token
    - export AWS_ROLE_ARN="$TF_APPLY_ROLE_ARN"
  script:
    - terraform -chdir=$TF_DIR init -input=false -lockfile=readonly
    - terraform -chdir=$TF_DIR apply -input=false tfplan
```
2. The `hashicorp/terraform` image's entrypoint is `terraform`; `entrypoint: [""]` is required so `script` lines run in a shell. The image is Alpine-based; install `jq` with `apk add --no-cache jq` in `before_script` if it is missing (check with `which jq`).
3. The AWS provider and backend read `AWS_WEB_IDENTITY_TOKEN_FILE` and `AWS_ROLE_ARN`. For GCP use a workload identity federation credential config file; for Azure set `ARM_USE_OIDC=true`, `ARM_OIDC_TOKEN` from the id token, `ARM_CLIENT_ID`, `ARM_TENANT_ID`, `ARM_SUBSCRIPTION_ID`.
4. `resource_group` makes GitLab run only one job of that group at a time, so two applies to one root never overlap.
5. One `TF_DIR` per job set; for several roots, use `parallel: matrix:` with `TF_DIR` values.

### Output
`.gitlab-ci.yml`.

### Quality Gate
- CI Lint (Build, Pipeline editor, Validate, or the `ci/lint` API) reports the file as valid.
- `sh ci/forbid-destroy.sh` exits 0.

---

## Phase 3: Prove the Gates

### Entry Criteria
- Pipeline file merged to a test branch.

### Actions
1. Open a merge request with a small change. The merge request widget shows the Terraform report (create, update, delete counts).
2. Break formatting deliberately in a scratch commit; the `validate` job must fail; revert.
3. Merge; the `apply` job appears as manual and the `production` environment requires an allowed deployer to run it.
4. Record each gate in `ci_gate_matrix`.

### Output
`ci_workflow_files`, `ci_gate_matrix`.

### Quality Gate
- The broken-format commit produced a failed `validate` job (job URL recorded).
- The apply job log ends with `Apply complete!`.

---

## Worked Example

Illustrative. `cloud = aws`, `TF_DIR = live/prod/app`.

- Phase 1: apply role trusts `project_path:acme/infra:ref_type:branch:ref:main`.
- Phase 2: CI Lint reports "Syntax is correct".
- Phase 3: MR widget shows "1 to change". Scratch commit with bad indentation fails `validate` at `terraform fmt -check`. After merge, `apply` waits as manual; after a deployer runs it, log ends `Apply complete! Resources: 0 added, 1 changed, 0 destroyed.`

---

## Exit Criteria

DONE when merge requests run validate and plan with a report, applies are manual on `main` through a protected environment using the saved plan, and applies are serialized.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | "terraform: unknown command sh" style error | **Adjust**: set `entrypoint: [""]` on the image. |
| Phase 2 | AssumeRoleWithWebIdentity denied | **Adjust**: compare the token's `sub` (pipeline for MR vs branch) with the trust condition; check `aud`. |
| Phase 3 | Plan artifact missing in apply | **Adjust**: `needs: [plan]` and artifact path must include `$TF_DIR/tfplan`. |
| Phase 3 | Stale plan rejected | **Retry**: rerun the pipeline from plan. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
