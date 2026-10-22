# Analog Monte Carlo Yield Estimation

Run Monte Carlo simulation with process variation and mismatch models to estimate yield, identify the failing parameter, and resize devices to center the design for target yield.

## Inputs

- `noise-optimized-sizes`: Final sized schematic
- `performance-specifications`: All specs that define pass/fail

## Outputs

- `yield-estimate`: Estimated yield percentage with confidence interval
- `yield-limited-parameter`: The specification most likely to cause failure, with its statistical distribution
- `final-design`: Design with any sizing adjustments for yield improvement

## Process

1. Configure Monte Carlo simulation with both global (inter-die) and local (intra-die mismatch) variation. Global variation shifts all transistor parameters together (Vt, tox, L_eff). Local mismatch is independent per transistor and scales as 1/sqrt(W*L).
2. Run at least 1000 Monte Carlo iterations. For each iteration, measure all performance parameters (gain, GBW, phase margin, offset voltage, CMRR, noise). Record the full distribution of each.
3. Calculate yield: the fraction of iterations where ALL specifications are simultaneously met. For 3-sigma yield (99.73%), each parameter must pass with margin. Identify the yield-limited parameter (the one with the thinnest margin to its spec limit).
4. Offset voltage is typically yield-limited in differential amplifiers. Offset is dominated by Vt mismatch of the input pair: sigma_Vos = Avt / sqrt(W*L). If offset spec is 5 mV and sigma_Vos is 3 mV, only 90% yield. To reduce to 1 mV sigma, increase W*L by 9x.
5. For specifications involving absolute values (gain, bandwidth), global variation dominates. For specifications involving matching (offset, CMRR), local mismatch dominates. Address each with the appropriate countermeasure.
6. After resizing for yield, re-run Monte Carlo to confirm. Plot yield vs device area for the yield-limited devices to find the minimum area that meets the yield target. This is the Pareto-optimal design point.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
