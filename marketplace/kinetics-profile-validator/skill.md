# Kinetics Profile Validator

Compare model predictions against experimental data to validate the mechanism.

## Inputs

- `concentration-profiles`: Model-predicted concentration-time curves
- `experimental-data`: Measured concentration-time data

## Outputs

- `validation-results`: Residual plots, RMSE per species, and systematic deviation assessment
- `model-adequacy-verdict`: Pass or fail with identified problem regions

## Process

1. Overlay model predictions on experimental data for each observable species.
2. Compute residuals and check for systematic patterns (not just magnitude).
3. Test against data not used in fitting (holdout validation) if available.
4. Identify time windows or species where the model deviates, suggesting missing reactions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
