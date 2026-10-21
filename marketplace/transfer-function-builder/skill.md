# Transfer Function Builder

Build the mathematical relationship between the proxy and the target climate variable.

## Inputs

- `calibration-dataset`: Paired proxy-climate values
- `method-choice`: Regression, weighted averaging (WA), modern analogue technique (MAT), or WA-PLS

## Outputs

- `transfer-function`: Fitted model relating proxy values to climate variable
- `calibration-statistics`: R-squared, RMSE, and number of components or analogues used

## Process

1. Fit the selected model using the calibration subset of data
2. Optimize model complexity (number of PLS components, number of analogues) using cross-validation
3. Report calibration statistics: R-squared, root mean square error of prediction
4. Save the fitted model parameters for application to fossil data

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
