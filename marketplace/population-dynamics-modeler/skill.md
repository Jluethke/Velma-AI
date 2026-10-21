# Population Dynamics Modeler

Estimate population size, survival, and recruitment from capture histories using appropriate models (Lincoln-Petersen, Jolly-Seber, occupancy).

## Inputs

- `capture-history-matrix`: Encounter histories from mark-recapture
- `detection-model`: Detection probability structure

## Outputs

- `population-estimate`: Abundance estimate with confidence interval
- `demographic-rates`: Survival, recruitment, and growth rate estimates
- `model-selection-table`: Candidate models ranked by AIC or similar criterion

## Process

1. Fit candidate population models to the encounter histories
2. Compare models using information criteria
3. Extract population size, survival, and recruitment from the best model
4. Report estimates with confidence intervals and model-averaged values if warranted

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
