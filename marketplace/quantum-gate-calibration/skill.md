# Quantum Gate Calibration

Calibrate single-qubit and two-qubit gates to minimize error rates, verified by randomized benchmarking.

## Inputs

- `qubit-parameters`: Coherence and frequency data for the target qubits
- `gate-set`: Gates to calibrate (single-qubit rotations, CNOT or CZ)

## Outputs

- `calibrated-gates`: Gate pulse parameters (amplitude, duration, frequency, drag coefficient) per gate
- `gate-error-rates`: Single-qubit and two-qubit error rates from randomized benchmarking

## Process

1. Optimize single-qubit gate pulses using DRAG calibration to suppress leakage
2. Calibrate two-qubit gates (cross-resonance or controlled-Z) and tune up conditional phase
3. Run single-qubit and interleaved randomized benchmarking to measure gate error rates
4. Iterate calibration if error rates exceed the target threshold

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
