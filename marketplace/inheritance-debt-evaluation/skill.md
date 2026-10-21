# Inheritance Debt Evaluation

Evaluate whether to use inheritance to pay off debts: which debts, partial or full payoff, and opportunity cost.

## Inputs

- `current_debts`: All outstanding debts with rates
- `inheritance_amount`: Available cash from inheritance
- `investment_expectations`: Expected return if invested instead

## Outputs

- `payoff_recommendation`: Which debts to pay off
- `opportunity_cost`: What the money could earn invested
- `remaining_after_debt`: What is left after recommended payoffs

## Process

1. List all debts by interest rate
2. Compare debt rates to expected investment returns
3. Recommend payoff for high-rate debts
4. Calculate remaining inheritance after payoffs
5. Factor in psychological benefit of debt freedom

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
