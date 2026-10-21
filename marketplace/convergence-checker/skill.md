# Convergence Checker

Diagnose whether the chains have converged to the posterior and the samples are usable.

## Inputs

- `posterior-samples`: draws from all chains
- `sampling-metadata`: sampler diagnostics

## Outputs

- `convergence-report`: R-hat, ESS, trace plots, and divergence summary per parameter
- `convergence-verdict`: pass/fail with specific remediation if failed

## Process

1. Compute R-hat (potential scale reduction factor) for each parameter; flag any above 1.01
2. Compute effective sample size (ESS bulk and tail); flag any below 400
3. Count divergent transitions and energy Bayesian fraction of missing information (E-BFMI)
4. Generate trace plots and rank histograms for visual inspection

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
