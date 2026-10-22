# Cash Flow Stress Tester

Stress-test the cash flow: what happens if the largest inflow is delayed by 30 days, or two major outflows hit simultaneously?

## Inputs

- `revised-calendar`: The optimized cash flow calendar
- `float-analysis`: The float and reserve data

## Outputs

- `stress-scenarios`: Three stress scenarios (delayed inflow, accelerated outflow, combined) with the resulting cash position over 90 days
- `contingency-triggers`: The balance thresholds that trigger each contingency action: draw reserves, activate credit line, defer discretionary spending, accelerate collections

## Process

1. Scenario 1: the largest single inflow is delayed by 30 days. What is the lowest point in the cash balance? Can you survive without additional financing?
2. Scenario 2: two of the three largest outflows hit in the same week (insurance renewal plus tax payment, or two vendor invoices plus payroll). What is the lowest point?
3. Scenario 3: both happen simultaneously. This is the worst plausible case.
4. For each scenario, define the contingency trigger: at what balance level do you draw reserves, activate a credit line, defer discretionary spending, or accelerate collections? Write the triggers before the stress happens, not during.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
