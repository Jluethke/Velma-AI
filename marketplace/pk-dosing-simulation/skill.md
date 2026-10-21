# Pk Dosing Simulation

Simulate drug concentration profiles under alternative dosing regimens to support dose selection.

## Inputs

- `fitted-parameters`: Final PK model parameters
- `model-structure`: Model equations for simulation

## Outputs

- `simulated-profiles`: Predicted concentration-time curves for each dosing regimen
- `dosing-comparison-table`: Cmax, Cmin, AUC, and time above target for each regimen

## Process

1. Define candidate dosing regimens: dose amounts, intervals, and durations.
2. Simulate concentration-time profiles at steady state for each regimen.
3. Compute summary PK metrics: Cmax, Cmin (trough), AUC per interval, time above a pharmacological target.
4. For population models, simulate with inter-individual variability to show expected population range.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
