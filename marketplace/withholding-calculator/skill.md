# Withholding Calculator

Compute all withholdings: federal, state, and local taxes plus benefit deductions.

## Inputs

- `gross-pay-register`: Gross pay for each employee
- `employee-tax-elections`: W-4 elections and benefit enrollment data

## Outputs

- `net-pay-register`: Net pay after all withholdings
- `tax-liability-summary`: Total tax liabilities by jurisdiction

## Process

1. Calculate federal income tax withholding based on W-4 elections.
2. Calculate state and local income tax withholdings.
3. Calculate FICA (Social Security and Medicare) for employee and employer.
4. Deduct benefit premiums (health, dental, vision, retirement contributions).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
