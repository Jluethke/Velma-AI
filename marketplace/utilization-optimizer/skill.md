# Utilization Optimizer

Optimize credit utilization ratio through balance management and credit limit strategies.

## Inputs

- `current_balances`: Balances on all credit cards
- `credit_limits`: Credit limits per card
- `monthly_spending`: Typical monthly card spending

## Outputs

- `utilization_plan`: Target balances per card
- `payment_timing`: When to pay to optimize reporting
- `limit_increase_plan`: Cards to request increases on

## Process

1. Calculate current per-card and overall utilization
2. Set target utilization under 30% (ideally under 10%)
3. Plan balance paydown order for maximum impact
4. Time payments before statement closing dates
5. Request credit limit increases on oldest cards

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
