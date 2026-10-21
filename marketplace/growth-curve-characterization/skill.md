# Growth Curve Characterization

Characterize the growth kinetics of an isolate across conditions to determine lag, exponential, and stationary phase parameters.

## Inputs

- `pure-isolate`: Confirmed pure culture to characterize
- `growth-conditions`: Temperature, atmosphere, and media variations to test

## Outputs

- `growth-curves`: OD600 time series with fitted lag time, doubling time, and max OD for each condition
- `optimal-conditions`: Condition yielding the fastest exponential growth and highest yield

## Process

1. Inoculate standardized starter cultures and normalize to a fixed OD600
2. Measure OD600 at regular intervals across all condition combinations in triplicate
3. Fit the Baranyi or Gompertz growth model to extract lag, rate, and asymptote parameters
4. Identify the optimal condition set for downstream assays

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
