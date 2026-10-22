# Surrogate Cross Validation

Measure the surrogate accuracy honestly with cross-validation, so the reported error reflects prediction at unseen points rather than memorization of the training data.

## Inputs

- `fitted-surrogate`: The trained surrogate to be validated
- `simulation-outputs`: The training responses used for resampling checks

## Outputs

- `cross-validation-metrics`: Leave-one-out and k-fold error measures (R-squared, RMSE, PRESS) with per-point residuals
- `weakness-map`: Where in the input space the surrogate predicts poorly, flagged for adaptive sampling

## Process

1. Run leave-one-out cross-validation for small designs. Refit the surrogate N times, each time holding out one point, and predict the held-out value; the collected residuals give the predictive error without spending extra expensive runs. For kriging there are shortcut formulas that give leave-one-out residuals from a single fit.
2. Use k-fold cross-validation for larger designs. Split the data into k folds (k = 5 or 10), train on k - 1 and test on the held-out fold, rotate, and aggregate; this is cheaper than leave-one-out when refitting is costly and gives a stable error estimate.
3. Report R-squared and root-mean-square error together. The predictive R-squared = 1 - SS_res/SS_tot measures the fraction of variance explained on held-out data (target above about 0.9 for engineering use), while the RMSE gives the error in the output units; R-squared alone can look fine while the RMSE is too large for the decision.
4. Compute the PRESS statistic (predicted residual sum of squares) as the sum of squared leave-one-out residuals; a PRESS much larger than the training residual sum of squares is the signature of overfitting, where the surrogate hugs the training points but predicts badly between them.
5. Build a weakness map from the residuals. Record where the largest cross-validation errors occur in the input space; these regions, together with the kriging prediction variance, tell the adaptive-sampling step where new expensive runs will buy the most accuracy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
