# Paycheck Distributor

Generate pay stubs and distribute payments via direct deposit or check.

## Inputs

- `net-pay-register`: Net pay amounts and bank details
- `employee-roster`: Payment method preferences

## Outputs

- `payment-file`: ACH file or check run for distribution
- `pay-stubs`: Individual pay stubs for each employee

## Process

1. Generate the ACH direct deposit file with bank routing and account numbers.
2. Print checks for employees not on direct deposit.
3. Generate individual pay stubs with gross, deductions, and net details.
4. Distribute pay stubs electronically or in print.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
