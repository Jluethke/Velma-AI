# Payment Automation Setup

Set up automated payments with the chosen payoff order and extra payment allocation.

## Inputs

- `recommended_method`: Chosen payoff strategy
- `available_extra`: Monthly extra payment amount

## Outputs

- `automation_plan`: Which payments to automate and amounts
- `payment_calendar`: Monthly payment schedule aligned to pay dates
- `guard_rails`: Rules for when extra payments should pause

## Process

1. Map pay dates to payment due dates
2. Set up minimum auto-pay on all debts
3. Direct extra payments to target debt
4. Define rules for pausing extra payments (emergency)
5. Schedule monthly balance check

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
