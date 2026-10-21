# Cluster Stability Validator

Validate that the structure found in the reduced space is stable and not an artifact of hyperparameters or sampling.

## Inputs

- `reduced-representation`: observations in reduced space
- `hyperparameters`: method-specific settings to perturb

## Outputs

- `stability-report`: bootstrap confidence intervals, perturbation sensitivity, and cross-validation results
- `stable-clusters`: clusters or groupings that survive perturbation

## Process

1. Bootstrap the decomposition: resample observations and rerun, measuring how coordinates shift
2. Perturb hyperparameters (perplexity, n_neighbors) and check if structure persists
3. Cross-validate by holding out subsets and projecting them into the learned space
4. Report which structures are stable and which dissolve under perturbation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
