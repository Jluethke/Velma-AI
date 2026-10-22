# Marginal Decision Framework

Apply marginal analysis to the specific decision: should I spend more, spend less, or reallocate? The framework applies to any resource decision.

## Inputs

- `reallocation-opportunities`: The identified reallocation options
- `marginal-returns`: The marginal return data

## Outputs

- `spending-decisions`: For each category: increase, decrease, hold, or reallocate, with the specific amount and the expected impact
- `marginal-analysis-document`: The complete analysis: current allocation, marginal returns, reallocation opportunities, and decisions

## Process

1. For each category, apply the decision rule: if marginal return exceeds the cost of capital (or the opportunity cost of the next-best use), increase spending. If it is below, decrease.
2. Where the marginal return equals the opportunity cost, you are at the optimal allocation for that category. Hold.
3. Execute the reallocations in order of net gain. After each reallocation, re-estimate the marginal returns (they change as spending levels change).
4. Document the analysis and the decisions. Set the re-analysis frequency: monthly for high-velocity categories, quarterly for stable ones.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
