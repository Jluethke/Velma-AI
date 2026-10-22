# Fraud Investigator

Investigate flagged transactions to confirm or dismiss fraud.

## Inputs

- `flagged-transactions`: Transactions under investigation
- `alert-queue`: Prioritized alerts

## Outputs

- `investigation-findings`: Confirmed fraud, false positive, or inconclusive for each alert
- `evidence-package`: Supporting evidence for each confirmed case

## Process

1. Review the transaction details, customer history, and device data.
2. Contact the account holder if needed to verify the transaction.
3. Classify each alert as confirmed fraud, false positive, or inconclusive.
4. Compile the evidence for confirmed cases.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
