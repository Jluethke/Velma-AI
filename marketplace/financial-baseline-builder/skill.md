# Financial Baseline Builder

Build the baseline financial model: monthly income, monthly expenses, liquid reserves, and variable-rate obligations.

## Inputs

- `financial-snapshot`: Current monthly income by source, monthly expenses by category, liquid savings or reserves, and all variable-rate debt or obligations
- `entity-type`: Personal household or business entity

## Outputs

- `baseline-model`: Monthly surplus or deficit, liquid reserves in months of expenses, largest income source with its share, largest single expense, and all variable-rate obligations with current rates
- `baseline-runway`: At current burn rate with zero income, how many months of expenses the liquid reserves cover

## Process

1. Calculate total monthly income and total monthly expenses. The difference is the monthly surplus (positive) or deficit (negative). If it is a deficit, the stress test is already in progress.
2. Calculate baseline runway: liquid reserves divided by monthly expenses. This is how many months you survive with zero income before reserves are exhausted.
3. Identify the largest income source and its share of total income. Identify the largest recurring expense. List all variable-rate obligations (adjustable mortgages, credit lines, floating-rate business loans) with their current rate and monthly payment.
4. Record the baseline values. Every stress scenario will modify one or more of these values and recalculate the runway.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
