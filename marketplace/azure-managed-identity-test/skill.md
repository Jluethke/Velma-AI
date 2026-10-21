# Azure Managed Identity Test

Test for managed identity abuse paths including token theft and privilege escalation through identity assignments.

## Inputs

- `subscription-resource-map`: Resource inventory to locate identity-assigned resources
- `role-assignment-map`: RBAC assignments for the managed identities

## Outputs

- `identity-abuse-findings`: Identified managed identity abuse paths
- `token-theft-results`: Results of token acquisition attempts from compute resources

## Process

1. Identify all system-assigned and user-assigned managed identities
2. Test IMDS endpoint access from compute resources to obtain tokens
3. Check for over-privileged managed identity role assignments
4. Attempt to use obtained tokens to access resources beyond intended scope

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
