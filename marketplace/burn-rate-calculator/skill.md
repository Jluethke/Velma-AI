# Burn Rate Calculator

Calculate the monthly burn rate at current spending, 75% spending, and 50% spending. Separate fixed costs (cannot be cut quickly) from variable costs (can be cut immediately).

## Inputs

- `monthly-expenses`: All monthly expenses, categorized as fixed (contractual, cannot be reduced in under 90 days) or variable (can be reduced or eliminated within 30 days)
- `liquid-reserves`: The available reserves

## Outputs

- `burn-rate-scenarios`: Monthly burn rate at three levels: current (100%), reduced (75% of variable costs cut), and survival (50% of variable costs cut plus all discretionary eliminated)
- `minimum-viable-spend`: The absolute minimum monthly spend to keep the operation alive: only fixed obligations plus the bare minimum variable costs

## Process

1. Separate fixed costs (rent, loan payments, insurance, contractual salaries) from variable costs (marketing, discretionary spending, travel, subscriptions, overtime, temporary staff).
2. Current burn rate: all fixed plus all variable.
3. Reduced burn rate (75%): all fixed plus 75% of variable (cut the lowest-value 25% of variable spending).
4. Survival burn rate (50%): all fixed plus 50% of variable (cut everything that does not directly generate revenue or keep the lights on).
5. Minimum viable spend: only the costs that, if not paid, would cause legal default, loss of the facility, or inability to operate at all.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
