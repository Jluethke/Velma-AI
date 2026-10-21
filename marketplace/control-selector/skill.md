# Control Selector

Select the positive and negative controls: what known outcome confirms the assay works, and what baseline confirms it can detect a null result.

## Inputs

- `variable-registry`: All variables with classifications
- `experiment-description`: What the experiment is testing

## Outputs

- `positive-control-spec`: The positive control condition and its expected outcome
- `negative-control-spec`: The negative control condition and its expected outcome

## Process

1. Identify a condition known to produce a positive result with the measurement method.
2. Identify a condition known to produce no effect or the baseline level.
3. Verify that both controls use the same measurement pipeline as the experimental condition.
4. Document the expected outcome for each control and the criterion for pass/fail.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
