# Electrode Stability Test

Assess the electrode's stability over extended cycling or constant operation.

## Inputs

- `electrode-setup`: Cell configuration
- `cv-data`: Baseline CV for comparison after aging

## Outputs

- `stability-data`: Current or signal retention over time or cycle number
- `degradation-analysis`: Rate of signal loss, failure mode identification, and operational lifetime estimate

## Process

1. Run chronoamperometry at a fixed potential for the target duration
2. Alternatively run many CV cycles and compare the first and last cycles
3. Calculate the percent retention of peak current or response signal
4. Identify degradation modes: fouling, dissolution, structural damage, electrolyte decomposition

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
