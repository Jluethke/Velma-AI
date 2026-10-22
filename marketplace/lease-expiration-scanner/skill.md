# Lease Expiration Scanner

Identify leases approaching expiration and flag them for renewal action.

## Inputs

- `lease-portfolio`: All active leases with terms and dates
- `lead-time-days`: Number of days before expiration to start the renewal process

## Outputs

- `expiring-leases`: Leases due for renewal within the lead time
- `tenant-history`: Payment and compliance history for each expiring tenant

## Process

1. Pull all leases with expiration dates within the lead time window.
2. Flag each lease with tenant payment history and violation records.
3. Rank by priority: month-to-month conversions first, then by unit value.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
