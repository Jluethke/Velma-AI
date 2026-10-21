# Vault Configuration Reviewer

Review the configuration of the secrets management vault or store for access controls, encryption, and audit settings.

## Inputs

- `vault-access`: Admin access to the secrets management system
- `classification-map`: Secret classification map for policy validation

## Outputs

- `vault-config-findings`: Misconfigurations and policy violations in the vault
- `access-policy-map`: Who has access to what secrets and through which policies

## Process

1. Review access control policies for least-privilege compliance
2. Check encryption configuration (algorithm, key management, transit encryption)
3. Verify that audit logging is enabled and tamper-resistant
4. Test namespace isolation and tenant separation if multi-tenant

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
