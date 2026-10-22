# Processor Record Collector

Collect transaction records from the payment processor.

## Inputs

- `processor-source`: Payment processor name and access credentials
- `reconciliation-period`: Date range for reconciliation

## Outputs

- `processor-transactions`: All transactions from the processor for the period
- `processor-summary`: Totals by type (charges, refunds, fees, payouts)

## Process

1. Connect to the payment processor and pull transactions for the period.
2. Normalize the transaction format (date, amount, reference, type).
3. Calculate totals by transaction type.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
