# Income Baseline Setter

Establish the total available allocation by calculating net income after non-negotiable obligations.

## Inputs

- `income-sources`: All income sources with amounts and frequency
- `non-negotiable-obligations`: Taxes, debt minimums, insurance premiums, and any other amounts you cannot change in the next 90 days

## Outputs

- `allocatable-income`: Total monthly income minus non-negotiable obligations: the amount you actually get to allocate
- `obligation-ratio`: What percentage of income is consumed by non-negotiable obligations before you make any choices

## Process

1. Sum all income sources into a monthly total. For irregular income (freelance, bonuses, commissions), use the average of the lowest 3 months in the last 12 to avoid planning on best-case income.
2. List every non-negotiable obligation: minimum debt payments, taxes (estimated quarterly or withheld), insurance premiums, and any contractual obligation with a penalty for non-payment.
3. Subtract non-negotiable obligations from total income. The result is allocatable income: the only money you actually have discretion over.
4. Calculate the obligation ratio. If it exceeds 60%, flag that the real problem is the obligation load, not the discretionary spending. No amount of budgeting discipline fixes an income-to-obligation mismatch.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
