# Variance Estimator

Estimate how noisy your data is. High-variance data requires more observations to see a real signal. A metric that bounces between 3% and 7% daily needs far more data than one that stays between 4.8% and 5.2%.

## Inputs

- `metric-name`: The metric being evaluated
- `current-value`: The baseline value

## Outputs

- `estimated-variance`: The standard deviation of the metric over the measurement period, estimated from historical data or domain knowledge
- `variance-source`: Whether the variance estimate came from historical data (strong) or domain assumption (weak, requires more safety margin)

## Process

1. If historical data exists (at least 20 data points), calculate the standard deviation directly. This is the strong path.
2. If no historical data exists, estimate the plausible range (the metric probably falls between X and Y) and divide the range by 4 to approximate the standard deviation. This is the weak path and requires a 50% safety margin on the sample size.
3. Record whether the variance comes from data or assumption. This determines the confidence of the sample size calculation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
