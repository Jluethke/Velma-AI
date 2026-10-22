# Bank Statement Collector

Collect the bank statement for the reconciliation period.

## Inputs

- `processor-summary`: Expected totals from the processor
- `reconciliation-period`: Date range for reconciliation

## Outputs

- `bank-transactions`: All transactions from the bank for the period
- `bank-summary`: Totals by type (deposits, withdrawals, fees)

## Process

1. Download or import the bank statement for the period.
2. Normalize the transaction format to match the processor records.
3. Calculate totals by transaction type.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
