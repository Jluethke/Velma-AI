# Mc Convergence Diagnostics

Confirm the estimator has converged and report it with a confidence interval, using running statistics and batch means rather than trusting a single final value.

## Inputs

- `reduced-estimator`: The estimator being monitored as samples accumulate
- `target-precision`: The confidence-interval half-width that defines acceptance

## Outputs

- `convergence-report`: The running mean, standard error, and interval half-width versus sample count showing the plateau
- `reported-estimate`: The final estimate with its confidence interval and the achieved precision

## Process

1. Plot the running estimate against sample count. The running mean should settle and the running standard error should fall like 1/sqrt(N); a running mean that is still drifting, or a standard error that is not falling at the expected rate, means the run is not converged or the samples are not independent.
2. Report the confidence interval, not just the point estimate. Compute the half-width z*SE and present mu_hat plus or minus that half-width at the stated confidence; a Monte Carlo result without an interval is incomplete because a different seed would give a different number.
3. Use batch means when samples are correlated, as in Markov chain Monte Carlo. Split the run into non-overlapping batches, average within each, and estimate the standard error from the batch averages; this accounts for autocorrelation that would otherwise make the naive standard error far too small.
4. Track the effective sample size for correlated chains. The effective sample size N_eff = N/(1 + 2*sum of autocorrelations) can be far below the raw count; report N_eff so the interval reflects the real information content, not the number of iterations.
5. Validate independence of the generator. Confirm the pseudo-random stream has adequate period and low correlation for the sample size; for high-dimensional or very large runs prefer a well-tested generator, since a short-period or correlated stream silently biases the estimate no matter how many samples you draw.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
