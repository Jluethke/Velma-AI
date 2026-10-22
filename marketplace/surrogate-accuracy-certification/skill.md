# Surrogate Accuracy Certification

Certify the final surrogate on independent test data and state the domain over which its accuracy holds, so downstream users know where the surrogate may be trusted in place of the simulation.

## Inputs

- `updated-surrogate`: The final surrogate after adaptive refinement
- `input-space`: The domain over which the surrogate is claimed to be valid

## Outputs

- `certified-accuracy`: The test-set error and prediction-interval coverage that define the surrogate accuracy
- `validity-domain`: The region of input space where the surrogate meets its accuracy claim, with extrapolation flagged

## Process

1. Evaluate on the held-out test set that was never used in fitting or infill. Report the test RMSE and R-squared; because these points are independent, they give the honest accuracy a cross-validation can only approximate, and they are the number a downstream user should rely on.
2. Check prediction-interval coverage for probabilistic surrogates. For a kriging model, confirm that about 95 percent of test points fall within the predicted 95 percent interval y_hat plus or minus 1.96*s; under-coverage means the model understates its own uncertainty and will mislead any reliability or optimization study that trusts the variance.
3. State the validity domain explicitly. The surrogate is accurate inside the convex hull (or box) of the training points and degrades outside it; mark extrapolation regions as out of scope, because kriging reverts to the trend mean and polynomials diverge beyond the data, often silently.
4. Report accuracy per output and per region if it varies. A single global error can hide a region where the surrogate is poor; if the weakness map showed a hard subregion, report its local error separately so users do not apply a 2 percent global claim in a 20 percent local pocket.
5. Hand off the surrogate with its provenance. Record the design type and size, the model class and hyperparameters, the cross-validation and test errors, and the validity domain, so the surrogate can be used, audited, and retired when the underlying simulation or input ranges change.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
