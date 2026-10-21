# GitHub Actions OIDC Cloud Authentication

**One-line description:** Replaces long-lived cloud keys stored as GitHub Actions secrets with short-lived credentials from GitHub's OIDC provider, configuring a cloud role whose trust policy is bound to an exact repository and branch or environment (`sub` claim), updating workflows with `permissions: id-token: write` and the official login action, proving a run from another branch is refused, and deleting the old stored keys.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `cloud_provider` (string, required): `aws`, `gcp` or `azure`.
- `github_repo` (string, required): `<owner>/<repo>`, exactly as on GitHub.

---

## Outputs

- `oidc_role` (object): Cloud identity created (AWS role ARN, GCP workload identity provider and service account, or Azure app registration and federated credential), its trust conditions, and the permissions attached.
- `workflow_auth_change` (object): Workflow files changed, old secrets deleted, and the run URLs proving allowed and refused cases.

---

## Phase 1: Inventory Stored Cloud Keys

### Entry Criteria
- `gh auth status` succeeds with admin rights on `github_repo`.

### Actions
1. List stored secrets: `gh secret list --repo <github_repo>`, `gh secret list --env <env> --repo <github_repo>` for each environment (`gh api repos/<github_repo>/environments --jq '.environments[].name'`), and organization secrets visible to the repo.
2. Find which workflows use cloud keys: `rg -n -e 'AWS_ACCESS_KEY_ID' -e 'AWS_SECRET_ACCESS_KEY' -e 'GOOGLE_CREDENTIALS' -e 'GCP_SA_KEY' -e 'credentials_json' -e 'AZURE_CREDENTIALS' -e 'client-secret' .github/workflows/`.
3. For each, record: workflow file, job, trigger (`push` to which branches, `pull_request`, `workflow_dispatch`, tags), GitHub environment used, and what the job does in the cloud (the permissions it needs).
4. Decide the `sub` claim to trust per job. GitHub's OIDC `sub` formats:

| Job context | `sub` value |
|---|---|
| Job uses a GitHub environment `prod` | `repo:<owner>/<repo>:environment:prod` |
| Push to branch `main`, no environment | `repo:<owner>/<repo>:ref:refs/heads/main` |
| Tag push `v1.2.3` | `repo:<owner>/<repo>:ref:refs/tags/v1.2.3` (use a pattern like `refs/tags/v*` where the provider supports wildcards) |
| `pull_request` event | `repo:<owner>/<repo>:pull_request` |

   Prefer environments for deploy jobs, because environment protection rules (required reviewers, branch restrictions) then also gate the cloud credential. Never trust `pull_request` for a role that can deploy or read secrets; pull requests from forks run untrusted code.

### Output
Key usage inventory with the chosen `sub` per job.

### Quality Gate
- Every workflow line found in step 2 has a row with trigger, environment and chosen `sub`.

---

## Phase 2: Create The Cloud Trust

### Entry Criteria
- Phase 1 complete.

### Actions
1. AWS:
   - Provider (once per account): check `aws iam list-open-id-connect-providers`. If `token.actions.githubusercontent.com` is absent, create it with `aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --client-id-list sts.amazonaws.com` (older CLI versions also required `--thumbprint-list`; check `aws iam create-open-id-connect-provider help` and AWS's current GitHub OIDC guide).
   - Role trust policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::<account>:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:<owner>/<repo>:environment:prod"
      }
    }
  }]
}
```
     Use `StringEquals` with exact `sub` values. If you must use `StringLike` with `*`, keep the owner and repo literal (`repo:acme/billing:*`), never `repo:acme/*` or `*`.
   - Attach a permissions policy with only the actions the job needs (see `cfg-aws-iam-least-privilege-policy`).
2. GCP: create a workload identity pool and an OIDC provider for `https://token.actions.githubusercontent.com` with an `--attribute-mapping` including `google.subject=assertion.sub,attribute.repository=assertion.repository` and an `--attribute-condition` such as `assertion.repository=='<owner>/<repo>'`; then grant `roles/iam.workloadIdentityUser` on the target service account to the principal set for that repository. Use the `gcloud iam workload-identity-pools` commands from Google's "Workload Identity Federation with deployment pipelines" guide; check flag names with `--help`.
3. Azure: on the app registration or user-assigned managed identity, add a federated credential with issuer `https://token.actions.githubusercontent.com`, subject equal to the chosen `sub`, audience `api://AzureADTokenExchange` (`az ad app federated-credential create --id <app-id> --parameters @fic.json`). Assign the narrowest RBAC role at the narrowest scope.

### Output
Cloud identity with exact trust conditions.

### Quality Gate
- The trust condition contains the literal `<owner>/<repo>` and no wildcard in the owner or repo part (print the trust policy, `aws iam get-role --role-name <r> --query Role.AssumeRolePolicyDocument`, or the GCP/Azure equivalent).

---

## Phase 3: Switch Workflows, Prove Refusal, Delete Keys

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Change one workflow job at a time:
```yaml
permissions:
  id-token: write
  contents: read
jobs:
  deploy:
    environment: prod
    steps:
      - uses: aws-actions/configure-aws-credentials@<tag-or-sha>
        with:
          role-to-assume: arn:aws:iam::<account>:role/gha-billing-prod
          aws-region: us-east-1
```
   GCP: `google-github-actions/auth@<tag>` with `workload_identity_provider` and `service_account`. Azure: `azure/login@<tag>` with `client-id`, `tenant-id`, `subscription-id` (no `client-secret`). Setting `permissions:` at workflow or job level removes the default token permissions not listed, so list `contents: read` and any others the job used.
2. Remove the `env:` or `with:` lines that referenced the stored keys.
3. Run the job from the trusted context (a push to `main` or a deployment to `prod`). Add a step `aws sts get-caller-identity` (GCP: `gcloud auth list`; Azure: `az account show`) and record that the role ARN appears.
4. Prove refusal: run the same workflow from a different branch (`workflow_dispatch` on `test/oidc-refusal`). Expected: the login step fails with `Not authorized to perform sts:AssumeRoleWithWebIdentity` (AWS) or the provider's equivalent. Record the run URL. If it succeeds, the trust is too broad.
5. Delete stored keys only after both runs: `gh secret delete AWS_ACCESS_KEY_ID --repo <github_repo>` and `gh secret delete AWS_SECRET_ACCESS_KEY --repo <github_repo>` (and env-level ones with `--env`). Then deactivate and delete the IAM user's keys with `cfg-aws-access-key-rotation` Phase 3, or delete the GCP service account key (`gcloud iam service-accounts keys delete <key-id> --iam-account <sa>`), or the Azure client secret.

### Output
`oidc_role`, `workflow_auth_change`.

### Quality Gate
- The trusted run shows the role identity; the refusal run fails at the login step (both run URLs recorded).
- `gh secret list --repo <github_repo>` no longer lists the cloud key secrets.

---

## Common Mistakes To Avoid

- Do not trust `repo:<owner>/*` or `*`; any repository in the organization (or anywhere) could assume the role.
- Do not forget `id-token: write`; the login action then fails with a message about missing `ACTIONS_ID_TOKEN_REQUEST_URL`.
- Do not trust the `pull_request` subject for deploy roles.
- Do not delete stored keys before the OIDC run succeeds.

---

## Worked Example

Illustrative. `github_repo=acme/billing`, `cloud_provider=aws`, deploy job uses environment `prod`.

```
$ aws iam get-role --role-name gha-billing-prod --query 'Role.AssumeRolePolicyDocument.Statement[0].Condition'
{"StringEquals": {"token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
                  "token.actions.githubusercontent.com:sub": "repo:acme/billing:environment:prod"}}
```
Run on `main` deploying to `prod`: `aws sts get-caller-identity` prints `arn:aws:sts::123456789012:assumed-role/gha-billing-prod/GitHubActions`.
Run from `test/oidc-refusal` without the environment: `Error: Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity`.
```
$ gh secret delete AWS_ACCESS_KEY_ID --repo acme/billing
✓ Deleted secret AWS_ACCESS_KEY_ID from acme/billing
```

---

## Exit Criteria

DONE when every job that used stored cloud keys authenticates through OIDC with an exact repository and environment or branch condition, a run from an untrusted ref was refused, and the stored keys are deleted from GitHub and revoked in the cloud.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Job runs on a self-hosted runner outside the cloud | **Adjust**: OIDC still works; the runner needs outbound access to the cloud STS endpoint. |
| Phase 2 | No permission to create IAM roles or providers | **Return**: ask the cloud admin with the trust policy text prepared. |
| Phase 3 | Login fails from the trusted context | **Retry**: print the token's claims (the `sub` in the error or a debug step using the `actions/github-script` `core.getIDToken()` call) and match the trust condition to the actual `sub`. |
| Phase 3 | Refusal run succeeds | **Stop**: narrow the trust condition before deleting keys. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
