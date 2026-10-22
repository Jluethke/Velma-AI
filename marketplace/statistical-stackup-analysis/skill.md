# Statistical Stackup Analysis

Apply RSS and Monte Carlo methods to predict the actual statistical distribution of the functional dimension, accounting for the probability that not all dimensions simultaneously hit their extremes.

## Inputs

- `worst-case-results`: Worst-case results showing margin or lack thereof
- `sensitivity-ranking`: Dimension contribution ranking

## Outputs

- `rss-results`: Mean and 3-sigma limits of the functional dimension under RSS assumption, with the defect rate if limits are exceeded
- `monte-carlo-results`: Full probability distribution of the functional dimension from Monte Carlo simulation, with percentile values at 0.1%, 1%, 50%, 99%, 99.9%

## Process

1. Calculate the RSS stackup. Assuming each tolerance represents a 3-sigma range (99.73% of parts fall within tolerance) and dimensions are normally distributed: sigma_gap = sqrt(sum of (tolerance_i / 6)^2). The 3-sigma gap range is G_nom +/- 3 * sigma_gap. This predicts a 0.27% defect rate (2700 ppm) at the tolerance limits.
2. RSS validity check: RSS assumes all dimensions are independent and normally distributed. This fails when dimensions are correlated (made on the same machine in the same setup), when distributions are not normal (skewed by tool wear, truncated by inspection), or when the chain has fewer than 4 dimensions (central limit theorem needs at least 4 contributors to be reasonable).
3. Run a Monte Carlo simulation for the most accurate prediction. Assign a distribution to each dimension: normal for machined features (sigma = tolerance/6), uniform for purchased components (equally likely anywhere in tolerance), skewed for features subject to tool wear. Generate 100,000 random assemblies.
4. Extract percentiles from the Monte Carlo results. The 0.1% and 99.9% percentiles represent 1000-ppm defect levels. Compare these to the functional requirement limits. If the requirement is met at 99.9%, the design works for all practical purposes.
5. If the Monte Carlo shows excess defects: identify which dimensions contribute most to the tail (not the same ranking as worst-case). Use the Monte Carlo to simulate the effect of tightening individual tolerances, and find the cheapest combination of tightening that brings defects below the target.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
