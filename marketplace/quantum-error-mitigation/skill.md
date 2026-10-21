# Quantum Error Mitigation

Select and configure error mitigation techniques (ZNE, PEC, measurement error mitigation) suited to the circuit and noise profile.

## Inputs

- `noise-model`: Calibrated noise model identifying dominant error channels
- `transpiled-circuit`: Circuit to be mitigated

## Outputs

- `mitigation-strategy`: Selected mitigation methods with configuration parameters
- `overhead-estimate`: Additional circuit executions or classical compute required per method

## Process

1. Evaluate applicability of zero-noise extrapolation (ZNE) based on circuit depth and noise structure
2. Assess probabilistic error cancellation (PEC) feasibility given the gate noise characterization
3. Configure measurement error mitigation using the readout assignment matrix
4. Estimate the shot overhead and classical post-processing cost for the chosen strategy

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
