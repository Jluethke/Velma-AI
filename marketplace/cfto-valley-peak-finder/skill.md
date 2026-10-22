# Cfto Valley Peak Finder

Find the low points and high points in the balance.

## Inputs

- `daily-balance-curve`: The running balance across the horizon

## Outputs

- `cash-valleys`: Dates where the balance dips below the comfort line
- `cash-peaks`: Dates where the balance sits well above the comfort line

## Process

1. Scan the balance curve for local minimums below the comfort line.
2. Scan the balance curve for local maximums above the comfort line.
3. Record the date, depth, and duration of each valley and peak.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
