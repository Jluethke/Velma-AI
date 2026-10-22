# Monte Carlo Statistical Analysis

Configure and run Monte Carlo simulation to capture the combined effect of global and local variation, estimate yield, and identify the parametric yield limiter.

## Inputs

- `corner-simulation-results`: Corner results confirming the design passes at all fixed corners
- `variation-catalog`: Variation sources with statistical parameters

## Outputs

- `statistical-distributions`: Distribution of each performance parameter from Monte Carlo
- `yield-estimate`: Parametric yield with the yield-limiting parameter identified
- `correlation-data`: Which performance parameters are correlated (fail together) vs independent

## Process

1. Configure Monte Carlo with both global and local variation enabled. Global variation: one random draw per die applied to all devices. Local variation: independent random draw per device. Ensure the SPICE models support both (typically separate model cards or flags).
2. Run at least 1000 points for initial yield estimation. For high-yield targets (>99.9%), use 10,000+ points or importance sampling to capture tail events. Each Monte Carlo point simulates the full circuit with a unique set of random parameters.
3. For each point, measure all performance parameters. Create histograms and fit distributions. Most parameters are approximately Gaussian. Check for bimodal distributions (indicating a design with two distinct operating modes under variation).
4. Calculate parametric yield: the fraction of Monte Carlo points where ALL parameters simultaneously meet specification. The yield-limiting parameter is the one whose specification boundary has the most failures nearby. Plot the cumulative distribution of each parameter against its specification to visualize margin.
5. Check for correlated failures: do points that fail one spec also tend to fail another? If so, fixing one failure mode automatically fixes the other. Use scatter plots of pairs of parameters to identify correlations. Strong correlations reduce the effective dimensionality of the yield optimization problem.
6. If yield is below target, perform a sensitivity analysis: which variation source contributes most to the yield-limiting parameter's spread? Address that source first (increase device size for mismatch, add tracking bias for global variation, add symmetry for systematic variation).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
