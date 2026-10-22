# Income Shock Simulator

Simulate an income shock: the largest income source drops 50%. Calculate the new monthly position, months to zero, and the minimum cuts needed to survive.

## Inputs

- `baseline-model`: The baseline financial model with income, expenses, and reserves

## Outputs

- `income-shock-result`: New monthly surplus or deficit after the shock, months to zero at the new burn rate, and the minimum monthly expense reduction required to break even
- `income-shock-cut-list`: The specific expenses to cut, in priority order, to close the gap created by the income shock

## Process

1. Reduce the largest income source by 50%. Recalculate total monthly income. Recalculate the monthly surplus or deficit.
2. If the result is a deficit, calculate months to zero: liquid reserves divided by the monthly deficit. This is the hard deadline.
3. Calculate the expense reduction needed to break even: the deficit amount. Rank all discretionary and reducible expenses by amount. Starting from the largest, accumulate cuts until the total cuts equal the deficit. These are the required cuts.
4. Assess realism: can these cuts actually be made in the warning time available? If the required cuts include fixed obligations (lease, loan payments), they cannot be reduced quickly and the effective months to zero is shorter than the calculation suggests.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
