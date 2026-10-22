# Utility Function Scorer

Score alternatives against weighted criteria using utility functions that convert raw performance into normalized scores.

## Inputs

- `weighted-criteria`: Criteria with AHP-derived weights
- `feasible-alternatives`: Alternatives to evaluate
- `performance-data`: Raw performance estimates per alternative per criterion

## Outputs

- `scored-alternatives`: Alternatives ranked by weighted utility score
- `scoring-rationale`: Per-cell documentation of how raw performance was converted to utility and the data source

## Process

1. For each criterion, define the utility function that maps raw performance to a 0-1 scale. Linear: utility = (value - worst) / (best - worst). Threshold: utility = 0 below threshold, 1 above. Diminishing returns: utility = 1 - exp(-k * value). The function shape must match how stakeholders value improvement.
2. For each alternative-criterion cell, estimate the raw performance. Document the source: analysis, simulation, vendor data, expert judgment, or historical data from similar systems. Assign a confidence level (high, medium, low) to each estimate.
3. Convert raw performance to utility using the defined function. Multiply utility by criterion weight. Sum weighted utilities across criteria to get the total score per alternative.
4. Rank alternatives by total score. Identify the margin between the top two alternatives. If the margin is smaller than the uncertainty in the estimates, the decision is not statistically significant and requires either better data or additional discriminating criteria.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
