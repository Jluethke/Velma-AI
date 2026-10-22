# Budget Baseline Wipe

Start from zero. List every category of spending with last period's amount, then set each to zero. The burden of proof is on the spending, not on the cut.

## Inputs

- `last-period-spending`: All spending from the previous period, categorized
- `available-funds`: Total funds available for the upcoming period

## Outputs

- `spending-categories`: Every category with its last-period amount and a zero starting point
- `total-available`: The total funds to allocate from zero

## Process

1. Export the previous period's spending by category. Include fixed obligations (rent, insurance, loan payments) and variable spending (marketing, supplies, entertainment, subscriptions).
2. Set every category to zero. The previous amount is reference data, not a starting point. Each category must earn its allocation from scratch.
3. Separate non-negotiable obligations (contractual commitments that cannot be reduced this period) from discretionary spending. Non-negotiable amounts are allocated first.
4. Calculate the remaining pool after non-negotiable allocations. This is the amount available for discretionary allocation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
