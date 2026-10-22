# Chaos Hypothesis Evaluator

Compare observed behavior against the hypothesis to determine if the system maintained steady state.

## Inputs

- `steady-state-hypothesis`: Expected normal behavior
- `metric-timeseries`: Measured metrics during the experiment

## Outputs

- `hypothesis-verdict`: Whether the steady state hypothesis held or was violated
- `deviation-details`: Details of any deviations from expected behavior

## Process

1. Compare each metric against its expected range
2. Identify any metrics that left the acceptable range and when
3. Assess whether the system recovered without intervention
4. Determine if the hypothesis held, partially held, or was violated

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
