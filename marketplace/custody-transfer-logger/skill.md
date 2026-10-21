# Custody Transfer Logger

Log every transfer of evidence between custodians with signatures and timestamps.

## Inputs

- `collection-records`: The initial collection documentation
- `transfer-details`: Who is transferring to whom and why

## Outputs

- `transfer-log`: Signed log of all custody transfers
- `current-custodian`: Current custodian and storage location for each item

## Process

1. Record the releasing and receiving custodian for each transfer
2. Capture the date, time, and reason for the transfer
3. Both parties verify the evidence identifiers and condition
4. Obtain signatures from both releasing and receiving custodians

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
