# Payoff Method Comparison

Compare snowball, avalanche, and hybrid payoff strategies with projected timelines and total interest.

## Inputs

- `debt_summary`: All debts with rates and balances
- `available_extra`: Extra monthly payment capacity

## Outputs

- `snowball_plan`: Snowball method timeline and total interest
- `avalanche_plan`: Avalanche method timeline and total interest
- `recommended_method`: Recommended approach with rationale

## Process

1. Model snowball (smallest balance first) payoff
2. Model avalanche (highest rate first) payoff
3. Compare total interest paid and payoff dates
4. Factor in psychological momentum
5. Recommend method based on debt profile

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
