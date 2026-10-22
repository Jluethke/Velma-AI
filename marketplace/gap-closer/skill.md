# Gap Closer

Close cash flow gaps by adjusting timing: accelerate inflows, decelerate outflows, or both.

## Inputs

- `negative-balance-days`: The days with cash flow gaps
- `cash-flow-calendar`: The full cash flow projection

## Outputs

- `timing-adjustments`: Specific changes to close each gap: invoice earlier, offer early-payment discounts, negotiate longer payment terms, batch payments to match inflow timing
- `revised-calendar`: The updated cash flow calendar with the timing adjustments applied

## Process

1. For each gap, identify the cause: is the gap caused by a delayed inflow (client pays late), a lumpy outflow (annual insurance premium), or a structural mismatch (you pay suppliers before customers pay you)?
2. Accelerate inflows: invoice immediately instead of at month-end, offer a 2% discount for payment within 10 days, require deposits for large projects, switch from net-60 to net-30 terms.
3. Decelerate outflows: negotiate longer payment terms with suppliers, batch discretionary payments to align with inflow timing, switch annual payments to monthly (if the annualized cost is acceptable).
4. Rebuild the calendar with the adjustments. If gaps remain, they must be covered by a line of credit or reserve draw.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
