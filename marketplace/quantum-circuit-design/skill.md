# Quantum Circuit Design

Design the quantum circuit for the target algorithm, transpile to the native gate set, and optimize circuit depth.

## Inputs

- `algorithm-spec`: Algorithm or experiment to implement (VQE, QAOA, Grover, simulation, etc.)
- `calibrated-gates`: Available native gate set and connectivity
- `qubit-ranking`: Best qubits for circuit assignment

## Outputs

- `transpiled-circuit`: Circuit transpiled to native gates with qubit mapping and depth statistics
- `circuit-metrics`: Gate count, circuit depth, CNOT count, and estimated success probability

## Process

1. Implement the target algorithm in an abstract circuit representation
2. Transpile to the native gate set using connectivity-aware routing and optimization passes
3. Map logical qubits to physical qubits using the quality ranking to minimize error impact
4. Report final gate count, CNOT count, circuit depth, and estimated success probability

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
