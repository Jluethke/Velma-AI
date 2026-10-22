# Syndrome Decoding Implementation

Implement real-time syndrome extraction and decoding to identify and correct errors during computation.

## Inputs

- `code-selection`: QEC code, distance, and stabilizer definitions
- `physical-layout`: Qubit layout and connectivity
- `error-model`: Error rates for decoder calibration

## Outputs

- `syndrome-extraction-circuit`: Quantum circuit for one round of stabilizer measurement
- `decoder-implementation`: Selected decoder algorithm with latency and accuracy characteristics
- `logical-error-rate-estimate`: Simulated logical error rate from Monte Carlo with the calibrated decoder

## Process

1. Design the syndrome extraction circuit. Each ancilla qubit is initialized in |+> (for X stabilizers) or |0> (for Z stabilizers), then CNOT-coupled to its neighboring data qubits in the prescribed order, then measured. The measurement result (0 or 1) is the syndrome bit for that stabilizer. A complete syndrome extraction round takes 4 CNOT layers plus preparation and measurement, about 1 microsecond in current hardware.
2. Select the decoder. Minimum-weight perfect matching (MWPM): pairs syndrome defects (stabilizer changes between rounds) with minimum total weight graph matching. Time complexity O(n^3) worst case but optimized implementations run in microseconds. Union-Find decoder: near-linear time, slightly lower accuracy than MWPM, better suited for real-time implementation. Neural network decoders: trained on simulated error data, can capture correlations MWPM misses, but latency is harder to bound.
3. Calibrate decoder weights. The decoder assigns weights to edges in the matching graph based on error probabilities. Measure individual qubit and gate error rates and use them to set the graph weights. Correlated errors can be modeled as hyperedges. Periodically recalibrate weights as qubit performance drifts.
4. Handle measurement errors. Syndrome bits themselves are noisy (measurement error rate comparable to gate error rate). The decoder must distinguish real data errors from measurement errors. This is done by repeating syndrome extraction d times and decoding in a 3D space-time matching graph (spatial dimensions for qubit location, temporal dimension for syndrome round number).
5. Validate by Monte Carlo simulation. Simulate the full QEC cycle (encode, d rounds of noisy syndrome extraction, decode, check for logical error) with the calibrated error model. Run millions of trials to estimate the logical error rate with statistical confidence. Verify that the logical error rate meets the target. Compute the lambda factor (suppression per unit distance increase) to extrapolate to other code distances.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
