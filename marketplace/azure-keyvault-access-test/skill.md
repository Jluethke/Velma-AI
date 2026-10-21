# Azure Keyvault Access Test

Test Key Vault access policies for excessive permissions and secret recovery from soft-deleted vaults.

## Inputs

- `subscription-resource-map`: Resource inventory to locate Key Vaults
- `identity-abuse-findings`: Identity paths that may access vaults

## Outputs

- `keyvault-findings`: Identified Key Vault access policy weaknesses
- `recovered-secrets`: Secrets accessible through excessive permissions

## Process

1. Enumerate all Key Vaults and their access policies
2. Test for overly permissive get/list/set permissions on secrets, keys, and certificates
3. Check for soft-deleted vaults with recoverable secrets
4. Attempt to access vault contents using compromised identities

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
