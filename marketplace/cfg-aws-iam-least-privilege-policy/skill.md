# AWS IAM Least-Privilege Policy From Observed Use

**One-line description:** Narrows an IAM role or user's permissions to what it actually uses, starting from IAM last-accessed data and an IAM Access Analyzer policy generated from CloudTrail, scoping Resource ARNs and adding condition keys, validating with `accessanalyzer validate-policy` and `check-no-new-access`, and proving required actions are allowed and removed ones denied with `simulate-principal-policy`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `principal_arn` (string, required): ARN of the IAM role or user to narrow (for example the OIDC deploy role or an application role).
- `aws_profile` (string, required): AWS CLI profile with IAM and Access Analyzer permissions in that account.

---

## Outputs

- `scoped_policy` (object): Path of the new policy JSON, the old policy ARNs it replaces, and the diff in actions and resources.
- `access_analyzer_findings` (object[]): `validate-policy` findings with their resolution, the `check-no-new-access` result, and simulation results.

---

## Phase 1: Measure What Is Used

### Entry Criteria
- `aws iam get-role --role-name <name>` (or `get-user`) succeeds with `--profile <aws_profile>`.
- A CloudTrail trail logging management events to S3 exists for the observation period (`aws cloudtrail describe-trails`), if you will generate a policy from activity.

### Actions
1. List current permissions: `aws iam list-attached-role-policies --role-name <name>` and `aws iam list-role-policies --role-name <name>` (inline). Save each document (`get-policy-version` with the default version ID; `get-role-policy` for inline).
2. Service-level last accessed:
```
JOB=$(aws iam generate-service-last-accessed-details --arn <principal_arn> --granularity ACTION_LEVEL --query JobId --output text --profile <aws_profile>)
aws iam get-service-last-accessed-details --job-id "$JOB" --profile <aws_profile> \
  --query 'ServicesLastAccessed[].[ServiceNamespace,LastAuthenticated,TotalAuthenticatedEntities]' --output text
```
   Rerun `get-service-last-accessed-details` until `JobStatus` is `COMPLETED`. Services with no `LastAuthenticated` were never used in the IAM tracking period (AWS documents the tracking period; read it in the IAM "last accessed information" docs). Action-level data exists only for some services; the rest show service level.
3. Generate a policy from CloudTrail activity with IAM Access Analyzer: `aws accessanalyzer start-policy-generation --policy-generation-details principalArn=<principal_arn> --cloud-trail-details file://ct.json`, where `ct.json` names the trail ARN, the IAM role Access Analyzer uses to read the trail, the regions, and `startTime`/`endTime` of the observation window. Then poll `aws accessanalyzer get-generated-policy --job-id <id>`. Read the exact parameter shapes with `aws accessanalyzer start-policy-generation help`; do not guess them. The console path (IAM > Roles > role > Generate policy) does the same.
4. The observation window is a user input. It must include every periodic job the principal runs (month-end, quarterly). If the window misses a job, that job breaks after narrowing.

### Output
Current policies, last-accessed table, generated policy draft.

### Quality Gate
- `JobStatus` is `COMPLETED` for last-accessed and the generated policy job, with outputs saved.
- The observation window start and end, and the periodic jobs it covers, are recorded.

---

## Phase 2: Write And Validate The Scoped Policy

### Entry Criteria
- Phase 1 complete.

### Actions
1. Start from the generated policy. For every statement:
   - Replace `Resource: "*"` with the ARNs actually used (generated policies often contain placeholders like `${BucketName}` you must fill). Look up resource ARNs in CloudTrail events (`requestParameters`) or the code.
   - Keep `"*"` only where the action does not support resource-level permissions; check the Service Authorization Reference table for the action ("Resource types" column empty means it requires `*`).
   - Split read and write actions into separate statements so they can be scoped differently.
2. Add conditions where they narrow without breaking: `aws:RequestedRegion` to used regions; `aws:ResourceTag/<key>` for tag-scoped access; `kms:ViaService` for KMS keys used only through one service; `s3:prefix` for `ListBucket`.
3. Remove services that last-accessed shows as never used. Remove `iam:*`, `sts:AssumeRole` to `*`, and `*:*` unless a recorded need exists.
4. Validate:
```
aws accessanalyzer validate-policy --policy-type IDENTITY_POLICY --policy-document file://scoped.json --profile <aws_profile> \
  --query 'findings[].[findingType,issueCode,findingDetails]' --output text
```
   Fix every `ERROR` and `SECURITY_WARNING`. Read every `WARNING` and `SUGGESTION`; fix or record why not.
5. Confirm the new policy grants nothing the old one did not: `aws accessanalyzer check-no-new-access --new-policy-document file://scoped.json --existing-policy-document file://old.json --policy-type IDENTITY_POLICY`. Expected `result: PASS`. For several old policies, merge them into one existing document for the comparison.

### Output
Validated scoped policy.

### Quality Gate
- `validate-policy` returns zero `ERROR` and zero `SECURITY_WARNING` findings.
- `check-no-new-access` returns `PASS`.

---

## Phase 3: Simulate, Deploy, Watch

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Simulate the new policy before attaching it, with the principal's real use cases:
```
aws iam simulate-custom-policy --policy-input-list file://scoped.json \
  --action-names s3:GetObject s3:PutObject ecr:BatchGetImage iam:CreateUser \
  --resource-arns arn:aws:s3:::billing-artifacts/releases/app.tar.gz \
  --query 'EvaluationResults[].[EvalActionName,EvalDecision]' --output text
```
   Expected: used actions `allowed`; removed ones (here `iam:CreateUser`) `implicitDeny`. `simulate-custom-policy` takes the policy text; `simulate-principal-policy` evaluates what is attached, and is used after deployment.
2. Deploy through IaC if the role is managed there (change the policy resource, apply). Otherwise create a managed policy, attach it, then detach old ones one at a time. Keep old policy versions until the watch period ends.
3. Watch for denials: query CloudTrail for `errorCode` `AccessDenied` or `Client.UnauthorizedOperation` by this principal over the watch period the user chooses (`aws cloudtrail lookup-events --lookup-attributes AttributeKey=Username,AttributeValue=<role session or user>` and filter with `jq` on `.CloudTrailEvent | fromjson | .errorCode`). Each denial of a legitimate action is added back with the narrowest resource.
4. After deployment, run `simulate-principal-policy --policy-source-arn <principal_arn>` with the same action list and record the results.

### Output
`scoped_policy`, `access_analyzer_findings`.

### Quality Gate
- Post-deploy `simulate-principal-policy` shows `allowed` for every used action and `implicitDeny` for every removed one listed.
- The watch period's denial query result is recorded, with each legitimate denial resolved.

---

## Common Mistakes To Avoid

- Do not invent IAM action names; copy them from the Service Authorization Reference or the generated policy.
- Do not narrow based on a window that misses periodic jobs.
- Do not attach the new policy and delete the old ones in one step.
- Do not leave generated placeholders such as `${BucketName}` in the deployed policy.

---

## Worked Example

Illustrative. `principal_arn=arn:aws:iam::123456789012:role/gha-billing-prod`, currently `AmazonS3FullAccess` and `AmazonEC2ContainerRegistryPowerUser`. Window: 90 days, includes the monthly release.

Phase 1 last accessed: `s3 2026-10-01`, `ecr 2026-10-01`, `ec2 (none)`. Generated policy uses `s3:GetObject`, `s3:PutObject` on `billing-artifacts`, and ECR push actions.

Phase 2:
```
$ aws accessanalyzer validate-policy ... --output text
$ aws accessanalyzer check-no-new-access ... --query result
"PASS"
```
Phase 3:
```
s3:PutObject    allowed
ecr:PutImage    allowed
iam:CreateUser  implicitDeny
s3:DeleteBucket implicitDeny
```
Watch period: 0 `AccessDenied` events.

---

## Exit Criteria

DONE when the principal's policy is replaced by one built from observed use with scoped resources, it validates with no errors or security warnings, grants no new access, simulation matches expectations before and after deployment, and the watch period's denials are resolved.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No CloudTrail trail to S3 | **Adjust**: use last-accessed data plus code review; record that the policy was not generated from activity. |
| Phase 2 | `check-no-new-access` returns `FAIL` | **Retry**: read `reasons` in the output and remove the added access. |
| Phase 3 | Production job fails with `AccessDenied` | **Adjust**: add the exact action and resource from the CloudTrail event; do not restore the full old policy unless the outage requires it. |
| Phase 3 | Principal is used by several workloads | **Stop**: split into one role per workload first; one shared role cannot be least privilege for all. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
