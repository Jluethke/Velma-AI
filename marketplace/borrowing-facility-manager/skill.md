# Borrowing Facility Manager

Manage the borrowing facilities for deficit periods.

## Inputs

- `liquidity-gaps`: Projected cash shortfalls
- `investment-positions`: Available investments that could be liquidated

## Outputs

- `borrowing-actions`: Draws on credit facilities or liquidations executed
- `facility-utilization`: Current utilization of each borrowing facility

## Process

1. Evaluate whether to draw on a facility or liquidate an investment.
2. Execute the draw or liquidation to cover the shortfall.
3. Update the facility utilization and covenant tracking.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
