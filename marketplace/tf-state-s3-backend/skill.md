# Remote State on S3 with Locking

**One-line description:** Creates a versioned, encrypted, private S3 state bucket, configures the `s3` backend with S3 native lock files (Terraform 1.10+) or a DynamoDB lock table for older CLIs, migrates existing state, and proves locking works by forcing a lock conflict.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root module paths that will use this backend.
- `env_strategy` (object, required): From `tf-env-strategy`; decides one key per directory or partial backend files.
- `aws_region` (string, required): Region of the state bucket, for example `us-east-1`.
- `state_bucket_name` (string, required): Globally unique bucket name, for example `acme-tfstate-123456789012`.

---

## Outputs

- `backend_config` (object): Per root module, the backend block or `.tfbackend` file contents and the state key.
- `state_migration_report` (object): Per root module, resource count before and after migration, the backup file path, and the post-migration plan result.

---

## Phase 1: Create the State Bucket

### Entry Criteria
- `aws sts get-caller-identity` succeeds with an identity allowed to create S3 buckets.

### Actions
1. The bucket cannot be managed by the state it stores. Create it with the AWS CLI, or in a separate `bootstrap/` root module that keeps local state committed nowhere.
2. Create and harden the bucket (for `us-east-1` omit `--create-bucket-configuration`):
```
aws s3api create-bucket --bucket <state_bucket_name> --region <aws_region> --create-bucket-configuration LocationConstraint=<aws_region>
aws s3api put-bucket-versioning --bucket <state_bucket_name> --versioning-configuration Status=Enabled
aws s3api put-public-access-block --bucket <state_bucket_name> --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-encryption --bucket <state_bucket_name> --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms"}}]}'
```
3. Versioning is mandatory: it is the only way to recover a state file that a bad apply or a bad `state push` overwrote.
4. Decide the lock mechanism:

| `terraform version` | Lock mechanism |
|---|---|
| 1.10 or later | `use_lockfile = true` (S3 native lock object `<key>.tflock`) |
| Earlier than 1.10 | DynamoDB table with partition key `LockID` (String) |
| Migrating from DynamoDB on 1.10+ | Set both `use_lockfile = true` and `dynamodb_table` for one release cycle, then remove `dynamodb_table` (deprecated since 1.11) |

5. Only if DynamoDB is needed:
```
aws dynamodb create-table --table-name terraform-locks --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST --region <aws_region>
```
   The attribute name must be exactly `LockID`.

### Output
Hardened bucket (and lock table if needed).

### Quality Gate
- `aws s3api get-bucket-versioning --bucket <state_bucket_name>` prints `"Status": "Enabled"`.
- `aws s3api get-public-access-block --bucket <state_bucket_name>` shows all four settings `true`.
- If DynamoDB is used: `aws dynamodb describe-table --table-name terraform-locks --query "Table.KeySchema"` shows `LockID` as `HASH`.

---

## Phase 2: Write the Backend Configuration

### Entry Criteria
- Bucket exists.

### Actions
1. Backend blocks cannot use variables or locals. Use literals, or an empty block plus `-backend-config` files.
2. Directories pattern, `live/prod/network/backend.tf`:
```
terraform {
  backend "s3" {
    bucket       = "acme-tfstate-123456789012"
    key          = "prod/network/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
```
3. Shared-root pattern: `backend "s3" {}` in code and `env/prod.tfbackend` containing the same key = value lines.
4. Key rule: one unique `key` per root module per environment. Two roots sharing a key overwrite each other's state.
5. Minimum IAM for the Terraform role on the state: `s3:ListBucket` on the bucket; `s3:GetObject` and `s3:PutObject` on the key; with `use_lockfile`, also `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` on `<key>.tflock`; with DynamoDB, `dynamodb:DescribeTable`, `GetItem`, `PutItem`, `DeleteItem` on the table.

### Output
`backend_config`.

### Quality Gate
- `grep -rh 'key *=' live/ env/ 2>/dev/null | sort | uniq -d` prints nothing (no duplicate keys).
- No backend block contains `var.` or `local.` (`grep -rnE 'backend.*\{' -A10 live/ | grep -E 'var\.|local\.'` prints nothing).

---

## Phase 3: Migrate State and Prove Locking

### Entry Criteria
- Backend config written; nobody else is running Terraform on these roots (announce a freeze).

### Actions
1. Work on ONE root module at a time.
2. Before changing anything, back up and count: `terraform state pull > pre-migrate.tfstate` and `terraform state list | wc -l`.
3. Run `terraform init -migrate-state -input=true` and answer `yes` to the copy prompt. In automation use `-force-copy`.
4. Count again: `terraform state list | wc -l` must equal the number from Action 2.
5. Run `terraform plan -input=false -detailed-exitcode`. Exit code 0 means no changes. Exit 2 means something differs: stop and investigate before any apply.
6. Prove locking: in terminal A run `terraform plan -lock-timeout=0s` while terminal B runs `terraform apply` and waits at the confirmation prompt. Terminal A must fail with "Error acquiring the state lock". Answer `no` in terminal B.
7. Move `pre-migrate.tfstate` outside the repo; it contains secrets. Delete the old local `terraform.tfstate` only after the plan in Action 5 is clean.

### Output
`state_migration_report`.

### Quality Gate
- Resource counts before and after are equal for every root module.
- `terraform plan -detailed-exitcode` exited 0 after migration.
- The lock test printed "Error acquiring the state lock".

---

## Worked Example

Illustrative. `live/prod/network` with local state, 23 resources, Terraform 1.9.8 (so DynamoDB lock table).

- Phase 1: bucket `acme-tfstate-123456789012` created; versioning `Enabled`; table `terraform-locks` with `LockID` HASH.
- Phase 2: backend block uses `dynamodb_table = "terraform-locks"` instead of `use_lockfile`.
- Phase 3: `terraform init -migrate-state` prints "Successfully configured the backend \"s3\"!". `state list | wc -l` prints 23 before and after. Plan prints "No changes. Your infrastructure matches the configuration." Lock test in terminal A prints "Error acquiring the state lock" with the Lock Info ID from terminal B.

---

## Exit Criteria

DONE when every root module stores state in the hardened bucket under a unique key, counts match, post-migration plans show no changes, and a lock conflict was observed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `BucketAlreadyExists` | **Adjust**: bucket names are global; append the account ID and retry. |
| Phase 2 | "Variables may not be used here" in backend block | **Adjust**: replace with literals or a `.tfbackend` file. |
| Phase 3 | Plan shows changes after migration | **Stop**: do not apply; compare `pre-migrate.tfstate` with `terraform state pull`; check that the right key and workspace were used. |
| Phase 3 | Stale lock after a crashed run | **Adjust**: confirm the holder in the Lock Info (Who, Created) is not running, then `terraform force-unlock <ID>`. Never force-unlock a lock held by a live run. |
| Phase 3 | AccessDenied on `.tflock` | **Adjust**: add the Phase 2 lock-file IAM permissions; retry. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
