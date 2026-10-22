# Claim Status Tracking

Track the claim through the adjudication process and record the payer response.

## Inputs

- `submitted-claim`: Claim record with tracking information

## Outputs

- `adjudicated-claim`: Claim with payer decision (paid, denied, partial) and payment details
- `denial-list`: List of denied line items with denial reason codes

## Process

1. Check the claim status with the payer at defined intervals (7, 14, 30 days).
2. Record the ERA/EOB when received, including allowed amounts, adjustments, and patient responsibility.
3. Separate paid claims from denied or partially denied claims.
4. Pass denied items to the denial management step.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
