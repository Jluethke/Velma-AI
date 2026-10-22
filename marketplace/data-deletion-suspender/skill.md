# Data Deletion Suspender

Suspend routine data deletion and retention policies for in-scope data.

## Inputs

- `system-list`: Systems subject to the hold
- `hold-scope`: Hold scope

## Outputs

- `suspension-confirmations`: Confirmations of deletion suspension per system
- `exception-log`: Any systems where suspension could not be applied

## Process

1. Coordinate with IT to suspend auto-deletion on in-scope systems
2. Disable retention policy enforcement for in-scope mailboxes and repositories
3. Document any systems where suspension was not technically feasible

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
