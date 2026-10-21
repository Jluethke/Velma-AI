# Sensitivity Runner

Execute the model at each sample point and collect the output of interest.

## Inputs

- `sample-matrix`: Matrix of parameter combinations
- `model-description`: Model code or executable

## Outputs

- `model-outputs`: Output value(s) at each sample point
- `run-log`: Completion status, runtime, and any failed evaluations

## Process

1. Set up the model runner with each parameter combination from the sample matrix.
2. Execute all model runs (parallelized where possible).
3. Collect the output of interest from each run.
4. Log any failed runs and decide whether to resample or exclude.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
