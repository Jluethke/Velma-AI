# Mc Sample Size Determination

Size the sample from the target precision using the central limit theorem, so the run is neither too short to trust nor wastefully long.

## Inputs

- `estimator-definition`: The estimator whose standard error must be bounded
- `target-precision`: The required confidence level and the allowed error on the estimate

## Outputs

- `required-sample-size`: The number of samples N that meets the precision target, with the formula and assumptions
- `precision-model`: The relationship between N and the achieved error, used to plan staged runs

## Process

1. Use the plain Monte Carlo error law. The standard error of a mean estimator is SE = sigma/sqrt(N), where sigma is the output standard deviation; the error shrinks as N^(-1/2) independent of the input dimension, which is the defining strength and weakness of the method: dimension-free, but slow.
2. Build the confidence interval from the central limit theorem. For large N the estimate is approximately normal, so the interval is mu_hat plus or minus z*SE, with z = 1.96 for 95 percent and z = 2.576 for 99 percent. Invert this to size the run: to reach an absolute error E at confidence level z, N = (z*sigma/E)^2.
3. Size probability estimates with their own formula. For a probability p the estimator variance is p*(1 - p)/N, so the coefficient of variation is CoV = sqrt((1 - p)/(N*p)). To estimate p = 1e-3 with CoV = 0.1 by plain Monte Carlo needs N = (1 - p)/(p*CoV^2), which is about 1e5 samples, and p = 1e-6 needs about 1e8, which is why rare events demand variance reduction.
4. Estimate sigma before committing. Run a pilot batch of a few thousand samples to estimate the output standard deviation (or the rough p), then size the full run from that estimate; sizing from a guessed sigma can be off by a large factor.
5. Plan a staged run with a stopping rule rather than a fixed N guess. Add samples in batches and stop when the half-width of the confidence interval drops below the target, which adapts automatically if the true variance differs from the pilot estimate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
