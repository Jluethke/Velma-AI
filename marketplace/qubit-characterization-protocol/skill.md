# Qubit Characterization Protocol

Characterize qubit parameters: T1, T2, readout fidelity, frequency, and anharmonicity for each qubit on the device.

## Inputs

- `device-spec`: Quantum processor model, qubit count, and connectivity map
- `characterization-targets`: Qubits to characterize and parameters of interest

## Outputs

- `qubit-parameters`: T1, T2, readout fidelity, frequency, and anharmonicity per qubit
- `qubit-ranking`: Qubits ranked by coherence and readout quality for circuit assignment

## Process

1. Run T1 relaxation experiments on each qubit and fit exponential decay
2. Run Ramsey and echo experiments to measure T2* and T2 (Hahn echo) decoherence times
3. Measure single-shot readout fidelity and assignment error matrix
4. Rank qubits by composite quality metric (T1, T2, readout fidelity) for circuit planning

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
