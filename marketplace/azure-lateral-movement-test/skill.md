# Azure Lateral Movement Test

Test for lateral movement paths across subscriptions, management groups, and between Azure AD and Azure resources.

## Inputs

- `identity-abuse-findings`: Identity abuse paths for pivot attempts
- `keyvault-findings`: Recovered credentials for lateral movement
- `token-theft-results`: Stolen tokens for cross-resource access

## Outputs

- `lateral-movement-paths`: Documented lateral movement chains
- `azure-pentest-report`: Final Azure penetration test report with all findings

## Process

1. Map all possible lateral movement paths using discovered credentials and tokens
2. Attempt cross-subscription access using compromised service principals
3. Test for Azure AD to Azure resource escalation paths
4. Compile all findings into the Azure penetration test report with remediation priorities

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
