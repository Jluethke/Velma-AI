# Monthly Invoice Generator

Generate monthly invoices for enrolled families.

## Inputs

- `rate-schedule`: Current tuition rates and fee schedule
- `fee-policy`: Late fees and additional charges policy

## Outputs

- `monthly-invoices`: Invoices for each enrolled family with line items for tuition, fees, credits, and balance due
- `billing-summary`: Summary of total invoiced amount, expected collections, and outstanding balances

## Process

1. Pull the enrollment roster and each family's program and schedule.
2. Calculate the tuition for the billing period, applying any discounts.
3. Add any additional charges (late pickup fees, supply fees, field trip fees).
4. Apply any credits (absences per policy, prepayment credits, subsidy payments received).
5. Generate and distribute the invoices by the billing date.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
