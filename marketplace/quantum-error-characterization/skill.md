# Quantum Error Characterization

Characterize the physical error model of the quantum processor to determine error rates, correlations, and dominant error channels.

## Inputs

- `processor-specifications`: Number of qubits, connectivity, gate set, and measured gate fidelities
- `coherence-data`: Measured T1, T2, and gate error rates for each qubit
- `target-logical-error-rate`: Required logical error rate for the target algorithm

## Outputs

- `error-model`: Characterized error channels (depolarizing, dephasing, leakage, crosstalk) with rates
- `error-correlations`: Spatially and temporally correlated error patterns
- `threshold-comparison`: Physical error rates compared to code thresholds

## Process

1. Measure individual gate error rates using randomized benchmarking (RB). Single-qubit RB gives the average gate error. Interleaved RB isolates individual gate errors. Typical state-of-the-art: 0.01-0.1% single-qubit, 0.1-1% two-qubit (CZ or CNOT).
2. Characterize error channels beyond the average rate. Use gate set tomography (GST) for detailed error models of each gate: coherent errors (over-rotation, axis tilt), stochastic Pauli errors (X, Y, Z rates separately), and leakage to non-computational states. The Pauli error channel is the most relevant for QEC analysis.
3. Measure correlated errors. Simultaneous RB on neighboring qubits detects crosstalk. Correlated errors are more damaging to QEC than independent errors because they can create undetectable error chains. Measure the correlated error rate and compare to the code's tolerance for correlated errors.
4. Compare to the QEC threshold. The surface code has a threshold of approximately 1% per round for depolarizing noise (including measurement errors). If the physical error rate p is below threshold, increasing the code distance d reduces the logical error rate as p_L ~ (p/p_th)^((d+1)/2). If p is above threshold, no amount of encoding helps.
5. Identify non-Pauli errors. Leakage (population leaving the qubit subspace) is not directly correctable by Pauli-based QEC. Measure leakage rates per gate cycle. If significant (> 0.1%), leakage reduction circuits (LRU: reset leaked qubits each cycle) must be incorporated. Cosmic ray events cause correlated burst errors across many qubits simultaneously; measure the rate and design mitigation (rapid qubit reset after detection).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
