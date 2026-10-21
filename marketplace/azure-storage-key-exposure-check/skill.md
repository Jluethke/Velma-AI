# Azure Storage Key Exposure Check

Check for storage account key exposure through access policies, SAS tokens, and connection strings in application settings.

## Inputs

- `subscription-resource-map`: Resource inventory to locate storage accounts
- `identity-abuse-findings`: Identity paths that may lead to storage access

## Outputs

- `storage-exposure-findings`: Exposed storage keys, SAS tokens, and public containers
- `data-access-evidence`: Evidence of unauthorized data access paths

## Process

1. Enumerate all storage accounts and their access configurations
2. Check for public blob containers and overly permissive SAS tokens
3. Search application settings and Key Vault references for storage connection strings
4. Test for storage account key access through compromised identities

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
