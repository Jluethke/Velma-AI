# AWS Secrets Manager Integration

**One-line description:** Creates a service's secrets in AWS Secrets Manager under per-environment names, scopes an IAM policy to exact secret ARNs (including the random 6-character suffix), handles customer managed KMS keys, reads values at runtime through a caching client or platform injection (ECS `secrets`, the Lambda extension, External Secrets Operator), sets up rotation where the credential type supports it, and proves access with the IAM policy simulator.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `config_keys` (object[], required): Classified keys; `secret` rows are created in Secrets Manager.
- `store_decision` (object, required): Output of `cfg-choose-secret-store` with names and delivery mechanism.
- `repo_path` (string, required): Absolute path to the service repository (IaC and app changes go here).

---

## Outputs

- `secret_store_config` (object): Region, secret names and ARNs, KMS key, delivery mechanism, rotation configuration, and the runtime read check output.
- `secret_access_policy` (string): Path of the IAM policy document and the `simulate-principal-policy` results.

---

## Phase 1: Create The Secrets

### Entry Criteria
- `aws sts get-caller-identity --profile <profile>` succeeds in the target account and region.
- If the project manages AWS with Terraform, CloudFormation or CDK, create the secret resources there (`aws_secretsmanager_secret` plus `aws_secretsmanager_secret_version`, or the equivalent) and set the value out of band; do not put the value in IaC source or state if avoidable. The CLI steps below show the same operations.

### Actions
1. Create each secret, value from a file (never on the command line):
```
aws secretsmanager create-secret --name prod/billing/stripe \
  --secret-string file:///tmp/stripe.json --kms-key-id <key-arn-or-alias> \
  --tags Key=service,Value=billing Key=env,Value=prod --profile <profile>
```
   Omit `--kms-key-id` to use the AWS managed key `aws/secretsmanager`; that key cannot be shared across accounts. A customer managed key is required for cross-account reads.
2. Delete the temporary file: `shred -u /tmp/stripe.json`.
3. Record the ARN from the output. Secrets Manager appends a hyphen and 6 random characters to every ARN (`...:secret:prod/billing/stripe-AbCdEf`).
4. Check: `aws secretsmanager describe-secret --secret-id prod/billing/stripe --profile <profile>` shows `VersionIdsToStages` with one version in `AWSCURRENT`.

### Output
Secrets created with recorded ARNs.

### Quality Gate
- `describe-secret` succeeds for every name in `store_decision` and shows an `AWSCURRENT` version.
- No `create-secret` or `put-secret-value` command in shell history contains a literal value (`history | rg secretsmanager` shows only `file://` forms).

---

## Phase 2: Scope Access

### Entry Criteria
- ARNs recorded.

### Actions
1. Write the identity policy for the workload role (task role, IRSA role, Lambda execution role) at `deploy/iam/billing-prod-secrets.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:<region>:<account>:secret:prod/billing/*"
    },
    {
      "Effect": "Allow",
      "Action": "kms:Decrypt",
      "Resource": "<customer-managed-key-arn>",
      "Condition": { "StringEquals": { "kms:ViaService": "secretsmanager.<region>.amazonaws.com" } }
    }
  ]
}
```
   Resource rules: a prefix wildcard `prod/billing/*` covers all secrets of this service. For a single secret, use the full ARN or `prod/billing/stripe-??????` (six `?`) to match the random suffix; `prod/billing/stripe*` would also match `prod/billing/stripe-admin`. Drop the KMS statement when using the AWS managed key.
2. Do not grant `secretsmanager:ListSecrets`, `PutSecretValue`, `DeleteSecret` or `*` to the application role.
3. Validate: `aws accessanalyzer validate-policy --policy-type IDENTITY_POLICY --policy-document file://deploy/iam/billing-prod-secrets.json`. Read `findings[].findingType`: `ERROR` and `SECURITY_WARNING` must be fixed; `WARNING` and `SUGGESTION` must be read and either fixed or recorded with a reason.
4. Simulate with the attached role:
```
aws iam simulate-principal-policy --policy-source-arn <role-arn> \
  --action-names secretsmanager:GetSecretValue \
  --resource-arns <stripe-arn> arn:aws:secretsmanager:<region>:<account>:secret:prod/payments/stripe-XyZ123 \
  --query 'EvaluationResults[].[EvalResourceName,EvalDecision]' --output text
```
   Expected: `allowed` for the own secret, `implicitDeny` for the other.
5. For cross-account access, add a resource policy on the secret (`put-resource-policy`) and the KMS key policy grant; the identity policy alone is not enough.

### Output
Policy file and simulation results.

### Quality Gate
- `validate-policy` returns zero `ERROR` and zero `SECURITY_WARNING` findings.
- The simulation prints `allowed` for own secrets and `implicitDeny` for at least one other service's secret.

---

## Phase 3: Runtime Delivery And Rotation

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Wire delivery for the platform recorded in `store_decision`:

| Platform | How |
|---|---|
| ECS | Task definition container `secrets: [{"name": "STRIPE_KEY", "valueFrom": "<secret-arn>"}]` (append `:jsonkey::` to pick one JSON key, for example `<arn>:api_key::`). The task execution role (not the task role) needs `GetSecretValue`. Values are read at task start; restart tasks after rotation |
| EKS | External Secrets Operator `SecretStore` with `provider.aws.service: SecretsManager` and IRSA auth, and an `ExternalSecret` with a `refreshInterval` you choose; see `cfg-k8s-secret-injection` |
| Lambda | AWS Parameters and Secrets Lambda Extension (local HTTP endpoint on port 2773 with the `X-Aws-Parameters-Secrets-Token` header), or a caching SDK client at cold start |
| App code (any) | Caching clients: Python `aws-secretsmanager-caching`, Java `aws-secretsmanager-caching-java`, Go `aws-secretsmanager-caching-go`; or the Secrets Manager Agent. Calling `GetSecretValue` on every request adds latency and cost |

2. Rotation:

| Credential | Rotation |
|---|---|
| RDS or Aurora master password | Create or modify the DB with `--manage-master-user-password`; RDS owns the secret and rotates it |
| RDS application user | `aws secretsmanager rotate-secret --secret-id <name> --rotation-lambda-arn <arn> --rotation-rules ScheduleExpression="<expr>"` using an AWS-provided rotation function template (alternating users strategy avoids downtime) |
| Third-party API key | Custom rotation Lambda implementing `createSecret`, `setSecret`, `testSecret`, `finishSecret` steps, or manual rotation per `cfg-rotate-leaked-secret` |

   The schedule is a user input from policy; do not invent one. Applications must re-read after rotation: caching clients refresh after their TTL; ECS needs a task restart; a long-lived DB pool needs reconnect on authentication failure.
3. Verify from the workload: run `aws secretsmanager get-secret-value --secret-id prod/billing/stripe --query 'length(SecretString)'` with the role's credentials (inside the pod or task), which prints a number, not the value. Then confirm the app's startup validation passes.

### Output
`secret_store_config`, `secret_access_policy`.

### Quality Gate
- The read check from the workload identity prints a length greater than 0.
- `describe-secret` shows `RotationEnabled: true` with the chosen schedule for every secret that has a rotation row above, or the rotation is recorded as manual with a reason.

---

## Common Mistakes To Avoid

- Do not write `Resource: "*"` for `GetSecretValue`.
- Do not forget `kms:Decrypt` with a customer managed key; the error is `AccessDeniedException` naming KMS.
- Do not pass secret values in `--secret-string '<value>'` on the command line.
- Do not put ECS secrets into plain `environment` entries in the task definition; those are visible to anyone who can describe the task definition.
- Do not delete a secret with `--force-delete-without-recovery` during cleanup; the default recovery window lets you undo a mistake.

---

## Worked Example

Illustrative. ECS Fargate, `prod/billing/stripe` and `prod/billing/db`, AWS managed key.

```
$ aws secretsmanager create-secret --name prod/billing/stripe --secret-string file:///tmp/stripe.json
{ "ARN": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/billing/stripe-Q8xTnB", "Name": "prod/billing/stripe", "VersionId": "..." }
$ aws accessanalyzer validate-policy --policy-type IDENTITY_POLICY --policy-document file://deploy/iam/billing-prod-secrets.json
{ "findings": [] }
$ aws iam simulate-principal-policy --policy-source-arn arn:aws:iam::123456789012:role/billing-exec ... --output text
arn:...:secret:prod/billing/stripe-Q8xTnB     allowed
arn:...:secret:prod/payments/stripe-XyZ123    implicitDeny
```
Task definition uses `"valueFrom": "arn:...:secret:prod/billing/db-Lm3PqR:password::"`. DB created with `--manage-master-user-password`; `describe-secret` shows `RotationEnabled: true`.

---

## Exit Criteria

DONE when every secret exists with an `AWSCURRENT` version, the workload role can read only its own secrets (validated and simulated), delivery works from the workload identity, and rotation is configured or recorded as manual.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ResourceExistsException` | **Adjust**: the name exists (possibly scheduled for deletion); `describe-secret` it, and use `restore-secret` or `put-secret-value` instead of creating. |
| Phase 2 | Simulation shows `allowed` for another service | **Stop**: the Resource pattern is too broad; narrow it. |
| Phase 3 | ECS task fails with `ResourceInitializationError` mentioning secrets | **Retry**: grant `GetSecretValue` (and `kms:Decrypt`) to the task execution role, and check VPC endpoint or NAT access to Secrets Manager. |
| Phase 3 | App fails after rotation | **Adjust**: add reconnect-on-auth-failure or lower the cache TTL; do not disable rotation. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
