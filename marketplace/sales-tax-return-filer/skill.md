# Sales Tax Return Filer

Prepare and file sales tax returns for each jurisdiction by the required deadline.

## Inputs

- `taxed-transactions`: Transactions with calculated tax for the period
- `nexus-assessment`: Active registrations and filing frequencies

## Outputs

- `filed-returns`: Filed returns with confirmation numbers
- `tax-payments`: Tax payment amounts remitted to each jurisdiction

## Process

1. Aggregate taxable sales and tax collected by jurisdiction.
2. Complete the return form for each jurisdiction.
3. Submit the return and remit the tax payment by the filing deadline.
4. Save filing confirmations and payment receipts.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
