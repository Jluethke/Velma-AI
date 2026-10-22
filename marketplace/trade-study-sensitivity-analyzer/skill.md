# Trade Study Sensitivity Analyzer

Validate the trade study result through sensitivity analysis on weights and performance estimates to identify conditions under which the decision changes.

## Inputs

- `scored-alternatives`: Ranked alternatives with weighted scores
- `weighted-criteria`: Criteria weights
- `performance-data`: Raw performance estimates with confidence levels

## Outputs

- `sensitivity-report`: Tornado diagram, weight sensitivity ranges, Monte Carlo results showing decision stability
- `decision-recommendation`: Final recommendation with confidence level and conditions for revisiting

## Process

1. One-at-a-time weight sensitivity: for each criterion, increase its weight by 20% (scaling others proportionally) and check if the ranking changes. The criteria where a 20% increase changes the winner are the decision-sensitive criteria. Present as a tornado diagram.
2. Performance estimate sensitivity: for each low-confidence estimate, vary it by the uncertainty range and check if the ranking changes. If a single estimate change flips the decision, that estimate needs refinement before the decision is defensible.
3. Monte Carlo simulation: treat each performance estimate as a distribution (uniform for low confidence, triangular for medium, normal for high). Sample 10,000 combinations and record which alternative wins each trial. The win percentage is the decision confidence.
4. Write the recommendation: state the winning alternative, the confidence level from Monte Carlo, the conditions under which the decision should be revisited (which criteria weights or performance values changing would flip it), and any dissenting opinions from the decision team.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
