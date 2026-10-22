# Fitness Billing Renewals

Handle billing cycles, membership renewals, and session package expirations.

## Inputs

- `membership-tiers`: Active memberships and billing cycles
- `training-calendar`: Sessions used and remaining

## Outputs

- `billing-status`: Current billing status per client with outstanding balances and upcoming renewals
- `studio-operations-plan`: Complete personal training studio operations plan

## Process

1. Process monthly membership charges on the billing date.
2. Track package session usage and send expiration warnings.
3. Handle failed payments with the retry and suspension sequence.
4. Run the renewal outreach for expiring memberships and packages.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
