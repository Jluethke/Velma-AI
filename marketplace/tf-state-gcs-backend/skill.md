# Remote State on Google Cloud Storage

**One-line description:** Creates a versioned GCS bucket with uniform access and public access prevention, configures the `gcs` backend with a per-root prefix and automatic lock objects, grants least-privilege access, migrates state, and proves the lock.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root module paths that will use this backend.
- `env_strategy` (object, required): From `tf-env-strategy`.
- `gcp_project` (string, required): Project ID that owns the state bucket.
- `state_bucket_name` (string, required): Globally unique bucket name, for example `acme-tfstate-prod`.

---

## Outputs

- `backend_config` (object): Per root module, the `gcs` backend block or `.tfbackend` file and its `prefix`.
- `state_migration_report` (object): Per root module, resource counts before and after, backup path, and post-migration plan exit code.

---

## Phase 1: Create the Bucket

### Entry Criteria
- `gcloud auth list` shows an active account; `gcloud config get-value project` or `--project` targets `gcp_project`.

### Actions
1. Create the bucket outside the state it will hold (gcloud, or a `bootstrap/` root module):
```
gcloud storage buckets create gs://<state_bucket_name> --project=<gcp_project> --location=<location> --uniform-bucket-level-access --public-access-prevention
gcloud storage buckets update gs://<state_bucket_name> --versioning
```
   `<location>` is a user decision (region or multi-region); do not pick one for them.
2. Grant the Terraform service account object access on this bucket only:
```
gcloud storage buckets add-iam-policy-binding gs://<state_bucket_name> --member=serviceAccount:<sa-email> --role=roles/storage.objectAdmin
```
   Do not grant `roles/storage.admin` at project level for state access.
3. Optional customer-managed encryption: set the bucket default key, or set `kms_encryption_key` in the backend block. Do not use the `encryption_key` (customer-supplied key) option unless the team can store that key outside Terraform for every run.

### Output
Bucket with versioning and uniform access.

### Quality Gate
- `gcloud storage buckets describe gs://<state_bucket_name> --format="value(versioning_enabled,uniform_bucket_level_access,public_access_prevention)"` shows versioning true, uniform access true, prevention `enforced`. If the field names differ in your gcloud version, run `gcloud storage buckets describe gs://<state_bucket_name>` and read the same three settings.

---

## Phase 2: Write the Backend Configuration

### Entry Criteria
- Bucket exists.

### Actions
1. Directories pattern, `live/prod/network/backend.tf`:
```
terraform {
  backend "gcs" {
    bucket = "acme-tfstate-prod"
    prefix = "prod/network"
  }
}
```
2. State lands at `gs://<bucket>/<prefix>/<workspace>.tfstate`, so the default workspace is `prod/network/default.tfstate`. Each root module needs a unique `prefix`.
3. Locking is automatic: Terraform writes `<prefix>/<workspace>.tflock` while it holds the lock. There is no lock table to create.
4. Credentials order: Application Default Credentials (`gcloud auth application-default login` locally, Workload Identity Federation in CI). To run as a service account without a key file, add `impersonate_service_account = "<sa-email>"` to the backend block; the caller needs `roles/iam.serviceAccountTokenCreator` on that account. Do not commit JSON key files.
5. Backend blocks cannot use variables. Use literals or `-backend-config` files.

### Output
`backend_config`.

### Quality Gate
- Every root module has a distinct `prefix` (list them and check for duplicates with `sort | uniq -d`).
- `git ls-files '*.json' | xargs grep -l '"private_key"'` prints nothing.

---

## Phase 3: Migrate and Prove the Lock

### Entry Criteria
- Backend written; Terraform freeze announced for these roots.

### Actions
1. One root module at a time: `terraform state pull > pre-migrate.tfstate`; `terraform state list | wc -l`.
2. `terraform init -migrate-state`, answer `yes`.
3. `terraform state list | wc -l` must match. `gcloud storage ls gs://<bucket>/<prefix>/` must show `default.tfstate`.
4. `terraform plan -input=false -detailed-exitcode` must exit 0.
5. Lock test: start `terraform apply` in terminal A and leave it at the prompt; run `gcloud storage ls gs://<bucket>/<prefix>/` and confirm `default.tflock` exists; run `terraform plan -lock-timeout=0s` in terminal B and confirm "Error acquiring the state lock". Answer `no` in A.
6. Move `pre-migrate.tfstate` outside the repo.

### Output
`state_migration_report`.

### Quality Gate
- Counts equal; plan exit code 0; the `.tflock` object was observed during the lock test.

---

## Worked Example

Illustrative. `gcp_project = acme-platform`, root `live/prod/gke`, 17 resources.

- Phase 1: bucket created; describe shows versioning enabled and prevention enforced.
- Phase 2: `prefix = "prod/gke"`; `impersonate_service_account = "tf-prod@acme-platform.iam.gserviceaccount.com"`.
- Phase 3: counts 17 and 17; `gcloud storage ls gs://acme-tfstate-prod/prod/gke/` prints `default.tfstate` and, during the test, `default.tflock`. Plan prints "No changes."

---

## Exit Criteria

DONE when every root module uses a unique prefix in the versioned bucket, counts match, plans are clean, and the lock object was seen.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Org policy blocks bucket location | **Adjust**: ask the user for an allowed location. |
| Phase 2 | 403 on `storage.objects.create` | **Adjust**: grant `roles/storage.objectAdmin` on the bucket to the identity in use (`gcloud auth list`). |
| Phase 3 | Plan shows changes after migration | **Stop**: compare state backup with the pulled state; check the prefix and workspace. |
| Phase 3 | Stale `.tflock` after a crash | **Adjust**: confirm no run is active, then `terraform force-unlock <ID>` using the ID from the error. Do not delete the lock object by hand while a run may be live. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
