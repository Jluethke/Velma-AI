# Failure Data Analysis

Analyze test results using Weibull statistics to predict failure distributions and field reliability.

## Inputs

- `test-matrix`: Test conditions and sample sizes
- `acceleration-factors`: AF values for field life prediction

## Outputs

- `weibull-parameters`: Shape (beta) and scale (eta) parameters for each failure mechanism
- `field-life-prediction`: Predicted failure rate and characteristic life under field conditions

## Process

1. Plot failure data on Weibull probability paper (or use MLE/rank regression). For right-censored data (samples surviving to end of test), use suspension handling. Estimate shape parameter beta and characteristic life eta.
2. Interpret beta: beta < 1 indicates infant mortality (decreasing failure rate), beta = 1 is random failure (constant rate, exponential distribution), beta > 1 is wearout (increasing rate). Solder fatigue typically beta = 2-6.
3. Calculate confidence bounds on eta using likelihood ratio or Fisher matrix method. Report the lower confidence bound (typically 90% or 95%) for conservative life prediction.
4. Convert from test life to field life: eta_field = eta_test * AF. Calculate the failure rate at target field life: F(t) = 1 - exp(-(t/eta_field)^beta). For a 10-year field life target, verify that F(10 years) < acceptable failure rate (typically < 0.1% for consumer, < 0.001% for automotive).
5. If test shows failures before qualification endpoint: perform failure analysis to confirm the failure mechanism, redesign to address the mechanism, and retest. Do not simply increase sample size to pass; address the root cause.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
