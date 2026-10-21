# Causal Question Framer

Frame the causal question precisely: define the treatment, outcome, target population, and the counterfactual contrast of interest.

## Inputs

- `research-question`: informal statement of the causal claim to evaluate
- `available-data`: description of the dataset, its structure, and measurement details

## Outputs

- `causal-estimand`: precisely defined causal effect (ATE, ATT, CATE, etc.)
- `target-population`: the population the estimate should generalize to

## Process

1. Define the treatment variable, its levels, and how it was assigned
2. Define the outcome variable and when it is measured relative to treatment
3. Specify the causal estimand (ATE, ATT, CATE) and the counterfactual comparison
4. State the target population and any transportability concerns

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
