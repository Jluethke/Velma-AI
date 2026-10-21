# Remote State on Azure Blob Storage

**One-line description:** Creates a private, versioned Azure storage account and container for state, configures the `azurerm` backend with Entra ID auth instead of account keys, migrates state, and proves blob-lease locking.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_modules` (string[], required): Root module paths that will use this backend.
- `env_strategy` (object, required): From `tf-env-strategy`.
- `azure_subscription_id` (string, required): Subscription that owns the state storage account.
- `state_storage_account` (string, required): Storage account name (3 to 24 lowercase letters and digits, globally unique).

---

## Outputs

- `backend_config` (object): Per root module, the `azurerm` backend block or `.tfbackend` file and its `key`.
- `state_migration_report` (object): Per root module, resource counts before and after, backup path, and post-migration plan exit code.

---

## Phase 1: Create Storage

### Entry Criteria
- `az account show --query id -o tsv` prints `azure_subscription_id` (run `az account set --subscription <id>` first if not).

### Actions
1. Create storage outside the state it holds:
```
az group create --name rg-tfstate --location <location>
az storage account create --name <state_storage_account> --resource-group rg-tfstate --location <location> --sku <sku> --kind StorageV2 --min-tls-version TLS1_2 --allow-blob-public-access false
az storage account blob-service-properties update --account-name <state_storage_account> --resource-group rg-tfstate --enable-versioning true --enable-delete-retention true --delete-retention-days <days>
az storage container create --name tfstate --account-name <state_storage_account> --auth-mode login
```
   `<location>`, `<sku>` (redundancy) and `<days>` are user decisions; record the values used. Do not invent them.
2. Grant the Terraform identity `Storage Blob Data Contributor` scoped to the container or account:
```
az role assignment create --assignee <principal-id> --role "Storage Blob Data Contributor" --scope /subscriptions/<sub>/resourceGroups/rg-tfstate/providers/Microsoft.Storage/storageAccounts/<state_storage_account>
```
3. Optionally add a delete lock on the resource group: `az lock create --name tfstate-nodelete --resource-group rg-tfstate --lock-type CanNotDelete`.

### Output
Storage account and container.

### Quality Gate
- `az storage account show -n <state_storage_account> --query "{public:allowBlobPublicAccess,tls:minimumTlsVersion}"` prints `false` and `TLS1_2`.
- `az storage account blob-service-properties show --account-name <state_storage_account> --query isVersioningEnabled` prints `true`.

---

## Phase 2: Write the Backend Configuration

### Entry Criteria
- Container exists and role assignment is done (assignments can take minutes to apply).

### Actions
1. `live/prod/network/backend.tf`:
```
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "acmetfstate001"
    container_name       = "tfstate"
    key                  = "prod/network.tfstate"
    use_azuread_auth     = true
  }
}
```
2. `use_azuread_auth = true` uses Entra ID and the data-plane role. Do not put `access_key` in the file; if a key is unavoidable, pass it via the `ARM_ACCESS_KEY` environment variable from a secret store.
3. CI with OIDC: set `use_oidc = true` in the backend or `ARM_USE_OIDC=true`, plus `ARM_CLIENT_ID`, `ARM_TENANT_ID`, `ARM_SUBSCRIPTION_ID`.
4. Locking is automatic through a blob lease on the state blob. Nothing to create.
5. One unique `key` per root module.

### Output
`backend_config`.

### Quality Gate
- `grep -rn access_key live/ env/ 2>/dev/null` prints nothing.
- Every `key` value is unique (`sort | uniq -d` on the list prints nothing).

---

## Phase 3: Migrate and Prove the Lock

### Entry Criteria
- Freeze announced for these roots.

### Actions
1. One root at a time: `terraform state pull > pre-migrate.tfstate`; `terraform state list | wc -l`.
2. `terraform init -migrate-state`, answer `yes`.
3. Counts must match; `az storage blob list --container-name tfstate --account-name <acct> --auth-mode login --query "[].name" -o tsv` shows the key.
4. `terraform plan -input=false -detailed-exitcode` must exit 0.
5. Lock test: leave `terraform apply` at its prompt in terminal A; `az storage blob show --container-name tfstate --name prod/network.tfstate --account-name <acct> --auth-mode login --query properties.lease` shows `"state": "leased"`; terminal B `terraform plan -lock-timeout=0s` fails with "Error acquiring the state lock". Answer `no` in A.
6. Move the backup outside the repo.

### Output
`state_migration_report`.

### Quality Gate
- Counts equal; plan exit 0; lease state `leased` observed during the test.

---

## Worked Example

Illustrative. Root `live/prod/aks`, 31 resources.

- Phase 1: account `acmetfstate001`; versioning query prints `true`.
- Phase 2: key `prod/aks.tfstate`, `use_azuread_auth = true`.
- Phase 3: init prints "Successfully configured the backend \"azurerm\"!"; counts 31 and 31; lease query shows `leased` while terminal A waits; plan "No changes."

---

## Exit Criteria

DONE when every root uses a unique key with Entra ID auth, counts match, plans are clean, and a leased blob was observed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Storage account name taken or invalid | **Adjust**: lowercase letters and digits only, 3 to 24 chars; add a suffix. |
| Phase 2 | 403 `AuthorizationPermissionMismatch` | **Retry**: role assignments propagate slowly; wait and retry init; if it persists, confirm the assignment scope. |
| Phase 3 | Lease stuck after a crash | **Adjust**: confirm no run is active, then `terraform force-unlock <ID>`; as last resort `az storage blob lease break --blob-name <key> --container-name tfstate --account-name <acct>`. |
| Phase 3 | Plan shows changes after migration | **Stop**: compare backup and pulled state before any apply. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
