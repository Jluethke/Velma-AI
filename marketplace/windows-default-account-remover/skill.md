# Windows Default Account Remover

Remove or disable default accounts and guest access to reduce the attack surface.

## Inputs

- `account-policy-config`: Account policies already applied
- `benchmark-profile`: CIS or STIG benchmark with account requirements

## Outputs

- `account-remediation-log`: Record of accounts disabled, renamed, or removed
- `remaining-accounts`: Final list of active accounts with their roles

## Process

1. Disable the Guest account
2. Rename the built-in Administrator account
3. Remove unnecessary local accounts and service accounts
4. Verify that no default or test credentials remain active

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
