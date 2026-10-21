# AWS IAM Access Key Rotation

**One-line description:** Identifies the account and IAM user behind a leaked `AKIA` access key, rotates it with the two-key procedure (`create-access-key`, deploy, `get-access-key-last-used`, `update-access-key --status Inactive`, `delete-access-key`), checks for the AWS compromised-key quarantine policy, and queries CloudTrail for every call made with the old key.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `confirmed_leaks` (object[], required): Output of `cfg-triage-secret-findings`. Rows whose `type` is an AWS access key are processed; others are ignored.
- `aws_profile` (string, required): Named AWS CLI profile with IAM admin rights in the owning account (used as `--profile`). Never use the leaked key itself as the admin profile.

---

## Outputs

- `aws_rotation_log` (object[]): Per key: account ID, IAM user, old key ID, new key ID, quarantine policy found (true | false), time old key last used, time deactivated, time deleted, CloudTrail query and summarized results.

---

## Phase 1: Identify The Owner

### Entry Criteria
- At least one leak row has an access key ID starting with `AKIA` (long-term IAM user key) or `ASIA` (temporary STS key).
- `aws --version` prints AWS CLI v2. `aws sts get-caller-identity --profile <aws_profile>` succeeds.

### Actions
1. Apply by prefix:

| Prefix | Meaning | Action |
|---|---|---|
| `AKIA` | Long-term IAM user key | Continue with this flow |
| `ASIA` | Temporary STS credentials (expire on their own) | Find the role that issued them in CloudTrail; revoke active sessions for that role (IAM console "Revoke active sessions", which adds an `AWSRevokeOlderSessions` deny policy); then fix the source that leaked them |
| Other | Not an AWS access key ID | Return it to triage |

2. Find the account: `aws sts get-access-key-info --access-key-id AKIA... --profile <aws_profile>` prints `{"Account": "123456789012"}`. If that is not your account, notify the owner (record the account ID) and stop for this key.
3. Find the user. In the owning account, list users and their keys:
```
for u in $(aws iam list-users --query 'Users[].UserName' --output text --profile <aws_profile>); do
  aws iam list-access-keys --user-name "$u" --query "AccessKeyMetadata[?AccessKeyId=='AKIA...'].[UserName,Status,CreateDate]" --output text --profile <aws_profile>
done
```
   One line prints the user, status and creation date. A key belonging to the root user does not appear here; root keys show in the IAM credential report (`aws iam generate-credential-report` then `aws iam get-credential-report`); delete root keys and do not replace them.
4. Check for the AWS quarantine response: `aws iam list-attached-user-policies --user-name <user> --profile <aws_profile>`. A policy whose name starts with `AWSCompromisedKeyQuarantine` means AWS detected the key in public and restricted it. Record it; do not detach it until the old key is deleted.

### Output
Account, user, key status, quarantine status.

### Quality Gate
- The user name and the key's `Status` line are recorded from `list-access-keys` output.
- The `get-access-key-info` account ID equals the account of `<aws_profile>` (`aws sts get-caller-identity`), or the key is marked foreign.

---

## Phase 2: Create, Deploy, Confirm

### Entry Criteria
- Owner identified in your account.

### Actions
1. Decide whether to replace the key at all:

| Consumer | Replacement |
|---|---|
| Workload on EC2, ECS, EKS, Lambda | No new key; use the instance profile, task role, IRSA or EKS Pod Identity, execution role |
| GitHub Actions or other OIDC-capable CI | No new key; use `cfg-github-actions-oidc-cloud-auth` |
| Developer laptop | No new key; use IAM Identity Center (`aws configure sso`) |
| Third-party system that only accepts keys | Create a new key for a dedicated user with a narrow policy |

2. If a new key is needed, check the two-key limit: `aws iam list-access-keys --user-name <user> --profile <aws_profile>`. IAM allows at most two access keys per user. If two exist, the one that is not leaked and unused (check `get-access-key-last-used`) must be deleted first.
3. Create: `aws iam create-access-key --user-name <user> --profile <aws_profile> --output json > /tmp/newkey.json`. The secret is shown only in this response. Move it straight into the secret store from the file, then delete the file with `shred -u /tmp/newkey.json` (or `rm` where `shred` is unavailable).
4. Deploy all consumers from the rotation flow's consumer list.
5. Confirm the new key is used: `aws iam get-access-key-last-used --access-key-id <new id> --profile <aws_profile>` shows a `LastUsedDate` after the deploy. Last-used data can lag; recheck after a few minutes rather than assuming.

### Output
New key (or role-based replacement) live.

### Quality Gate
- `get-access-key-last-used` for the new key shows a date after the deploy time, or the consumer now uses a role (show the role ARN from `aws sts get-caller-identity` run by that consumer).

---

## Phase 3: Deactivate, Delete, Review CloudTrail

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Deactivate the old key: `aws iam update-access-key --user-name <user> --access-key-id <old id> --status Inactive --profile <aws_profile>`. Inactive keys can be reactivated; this is the safe intermediate step.
2. Watch for failures in consumers (application error rates, CI runs) for the observation period the user sets. If something breaks, a consumer was missed; fix that consumer rather than reactivating, unless production is down.
3. Delete: `aws iam delete-access-key --user-name <user> --access-key-id <old id> --profile <aws_profile>`. Confirm with `list-access-keys` that it is gone.
4. Query CloudTrail event history for the old key (management events, last 90 days, per region):
```
aws cloudtrail lookup-events --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=<old id> \
  --start-time <exposure_start ISO8601> --max-results 50 --region <region> --profile <aws_profile> \
  --query 'Events[].[EventTime,EventName,EventSource]' --output text
```
   Repeat for each region in use (`aws ec2 describe-regions --query 'Regions[].RegionName' --output text`). `lookup-events` paginates; the CLI follows pages automatically unless `--max-items` is set. For older events or data events (S3 object reads), query the trail's S3 export with Athena or CloudTrail Lake.
5. For each event, read `sourceIPAddress` and `userAgent` from the event JSON (`--query 'Events[].CloudTrailEvent'`). Flag events from IPs outside your known ranges, `iam:Create*`, `iam:Attach*`, `sts:GetFederationToken`, `ec2:RunInstances` in unused regions, and `s3:ListBuckets` from unknown agents.
6. If any flagged event exists, open an incident; also check for IAM users, keys, roles or login profiles created by the old key (`EventName` `CreateUser`, `CreateAccessKey`, `CreateLoginProfile`) and delete those persistence footholds as part of that incident.
7. After deletion, if a quarantine policy was attached, detach it only after reviewing it: `aws iam detach-user-policy --user-name <user> --policy-arn <arn>`.

### Output
`aws_rotation_log`.

### Quality Gate
- `aws iam list-access-keys --user-name <user>` no longer lists the old key ID.
- The CloudTrail query was run for every region in use and its event count per region is recorded.

---

## Common Mistakes To Avoid

- Do not delete the old key before the new one is confirmed in use.
- Do not run admin commands with the leaked key.
- Do not create a replacement key for a workload that can use a role; the replacement becomes the next leak.
- Do not stop at `us-east-1` in CloudTrail; attackers often run instances in regions you do not watch. IAM events themselves are recorded in `us-east-1`.

---

## Worked Example

Illustrative. Leak L02, key `AKIA4EXAMPLE7QXYZ`, profile `acme-admin`.

```
$ aws sts get-access-key-info --access-key-id AKIA4EXAMPLE7QXYZ --profile acme-admin
{ "Account": "123456789012" }
$ ... list-access-keys loop ...
deploy-bot	Active	2023-04-10T08:55:01Z
$ aws iam list-attached-user-policies --user-name deploy-bot --profile acme-admin
AWSCompromisedKeyQuarantineV3  (name as printed)
```
Consumer is a GitHub Actions workflow, so no new key: OIDC role `gha-deploy` added and confirmed. Then:
```
$ aws iam update-access-key --user-name deploy-bot --access-key-id AKIA4EXAMPLE7QXYZ --status Inactive --profile acme-admin
$ aws iam delete-access-key --user-name deploy-bot --access-key-id AKIA4EXAMPLE7QXYZ --profile acme-admin
$ aws cloudtrail lookup-events --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=AKIA4EXAMPLE7QXYZ --region us-east-1 ...
2024-03-09T02:11:40Z  GetCallerIdentity  sts.amazonaws.com
2024-03-09T02:11:52Z  ListBuckets        s3.amazonaws.com
```
Both from an unknown IP: incident opened.

---

## Exit Criteria

DONE when each AWS key's owner is identified, consumers use a role or a confirmed new key, the old key is deleted and absent from `list-access-keys`, and CloudTrail was queried in every used region with results recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Key belongs to another account | **Stop**: notify that account's owner with the account ID; you cannot rotate it. |
| Phase 1 | Key is a root user key | **Adjust**: delete it from the root credentials page; do not create a new root key. |
| Phase 2 | `LimitExceeded` on create | **Adjust**: delete the unused second key first (after confirming it is unused). |
| Phase 3 | `AccessDenied` on `lookup-events` | **Return**: ask for `cloudtrail:LookupEvents` permission; do not skip the review. |
| Phase 3 | Consumer fails after deactivation | **Retry**: fix that consumer; reactivate only if production is down, then repeat Phase 2 for it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
