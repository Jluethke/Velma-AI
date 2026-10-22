# Frc Cash Counter

Total the cash available without penalty.

## Inputs

- `financial-context`: The accounts and balances in scope
- `as-of-date`: The date the cash is counted as of

## Outputs

- `available-cash`: The cash available without penalty
- `cash-sources`: Where the cash sits and any committed portions

## Process

1. Total the cash across accounts available without penalty.
2. Note any committed funds that are not truly available.
3. Record the as-of date for the count.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
