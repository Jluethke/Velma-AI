# Unused Account Closer

Review and close unused online accounts.

## Inputs

- `email-accounts`: Email accounts to search for sign-up confirmations
- `media-library`: Media organization status

## Outputs

- `account-inventory`: All accounts found with keep/close decision
- `closed-accounts`: List of accounts closed or deletion requested

## Process

1. Search email for account creation confirmations.
2. Categorize each account as active, dormant, or abandoned.
3. Close or delete abandoned accounts.
4. Update passwords on accounts you keep.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
