# Quantum Noise Model

Build a noise model of the device from characterization data for use in simulation and error mitigation design.

## Inputs

- `qubit-parameters`: T1, T2, and readout error data
- `gate-error-rates`: Per-gate error rates from benchmarking

## Outputs

- `noise-model`: Calibrated noise model (depolarizing, thermal relaxation, readout) for the device
- `simulated-baseline`: Noisy simulation results for comparison with hardware runs

## Process

1. Construct per-qubit thermal relaxation channels from T1 and T2 data
2. Add depolarizing noise to each gate calibrated to measured error rates
3. Include readout error using the measured assignment matrix
4. Run the transpiled circuit on the noisy simulator to establish the baseline expectation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
