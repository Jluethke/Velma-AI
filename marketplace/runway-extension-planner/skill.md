# Runway Extension Planner

Plan the actions that extend the runway at each danger zone. Decisions made before the danger zone are better than decisions made during it.

## Inputs

- `runway-table`: The runway calculations
- `runway-danger-zones`: The danger zone thresholds and dates

## Outputs

- `extension-actions`: For each danger zone: the specific spending cuts, revenue acceleration, and asset liquidation actions that extend the runway, with the months gained from each
- `runway-monitoring-plan`: The monthly runway recalculation schedule with the data inputs and the escalation path when a danger zone is approaching

## Process

1. At the 12-month threshold: identify the variable costs with the lowest return. Reduce or eliminate them. Accelerate revenue: invoice faster, collect receivables, offer prepayment discounts.
2. At the 6-month threshold: cut all non-essential variable costs. Reduce headcount if applicable. Liquidate tier 2 assets. Activate credit lines if the cost is acceptable.
3. At the 3-month threshold: survival mode. Only minimum viable spend. Liquidate tier 3 assets. Negotiate payment deferrals with creditors. Explore emergency financing.
4. Recalculate the runway monthly. After each action, update the reserves and burn rate. The runway should be extending, not shrinking. If it is shrinking despite cuts, the revenue problem is structural.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
