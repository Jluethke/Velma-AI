# Fta Common Cause And Uncertainty

Account for common cause failures using the beta factor model and propagate parameter uncertainty through the fault tree using Monte Carlo simulation.

## Inputs

- `top-event-probability`: Point estimate of top event probability
- `importance-rankings`: Basic event importance measures
- `dominant-cut-sets`: Cut sets contributing most to risk

## Outputs

- `common-cause-adjusted-probability`: Top event probability after accounting for common cause failures in redundant channels
- `uncertainty-distribution`: 5th, 50th, and 95th percentile of top event probability from Monte Carlo propagation of basic event uncertainty
- `sensitivity-results`: Which basic event uncertainties contribute most to the output uncertainty, guiding where to invest in better failure rate data

## Process

1. Identify all redundant pairs or groups in the tree (basic events under AND gates that represent identical or similar components). For each group, apply the beta factor model: split the failure rate into independent (1-beta)*lambda and common cause beta*lambda. Add a new basic event representing the common cause failure to each AND gate containing the redundant group.
2. Select beta values from IEC 61508 tables or nuclear industry data (NUREG/CR-5497). Typical values: identical hardware in same environment beta = 0.05 to 0.10, identical hardware in different environments beta = 0.02 to 0.05, diverse hardware beta = 0.01 to 0.02. Document the basis for each beta selection.
3. Recalculate the top event probability with common cause events included. For a 1oo2 (one out of two) redundant system: P(fail) = 2*(1-beta)*lambda*tau * (1-beta)*lambda*tau + beta*lambda*tau. The common cause term often dominates, especially when independent reliability is high.
4. Propagate uncertainty using Monte Carlo simulation. Assign lognormal distributions to each basic event failure rate (mean from handbook, error factor 3 to 10 depending on data quality). Run 10,000 to 100,000 samples, calculating the top event probability each time. Report the 5th, 50th, and 95th percentiles.
5. Perform uncertainty importance analysis: for each basic event, calculate the correlation between its sampled values and the top event probability across all Monte Carlo trials. Events with high correlation and high variance are where better data collection reduces output uncertainty most.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
