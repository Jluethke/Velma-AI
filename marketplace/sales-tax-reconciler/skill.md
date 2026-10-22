# Sales Tax Reconciler

Reconcile tax collected against tax remitted and resolve variances.

## Inputs

- `taxed-transactions`: Tax collected on transactions
- `tax-payments`: Tax remitted to authorities

## Outputs

- `reconciliation-report`: Reconciliation of tax collected vs remitted
- `variance-explanations`: Explanations for any differences

## Process

1. Compare total tax collected to total tax remitted by jurisdiction.
2. Identify variances from timing differences, adjustments, or errors.
3. Document explanations for each variance.
4. Record any liability or receivable adjustments in the general ledger.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
