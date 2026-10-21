# Proxy Validation Tester

Validate the transfer function against independent data not used in calibration.

## Inputs

- `transfer-function`: Fitted proxy-climate model
- `calibration-dataset`: Full dataset including the verification subset

## Outputs

- `validation-results`: Verification R-squared, RMSE, and reduction of error (RE) statistic
- `residual-diagnostics`: Spatial and temporal patterns in residuals

## Process

1. Apply the transfer function to the withheld verification data
2. Compute verification statistics: R-squared, RMSEP, and RE or CE statistics
3. Examine residuals for spatial or temporal bias that would indicate model failure
4. Determine if the model passes standard validation thresholds (RE > 0)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
