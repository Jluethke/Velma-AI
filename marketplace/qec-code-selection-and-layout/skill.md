# Qec Code Selection And Layout

Select the QEC code and map it to the physical qubit layout with the required code distance for the target logical error rate.

## Inputs

- `error-model`: Physical error rates and channels
- `target-logical-error-rate`: Required logical error rate
- `processor-specifications`: Qubit count, connectivity, and layout

## Outputs

- `code-selection`: Selected QEC code with distance and parameters
- `physical-layout`: Mapping of data qubits and ancilla qubits to the physical processor
- `resource-overhead`: Number of physical qubits per logical qubit and syndrome extraction circuit depth

## Process

1. Select the QEC code. The surface code is the default choice for 2D nearest-neighbor connectivity (matches superconducting qubit architectures). It requires d^2 data qubits and (d-1)^2 + d^2 ancilla qubits for a distance-d code, totaling about 2*d^2 physical qubits per logical qubit. Alternative: color code (transversal non-Clifford gates but higher threshold requirement), LDPC codes (lower overhead at large distance but require long-range connectivity).
2. Calculate the required code distance. From the scaling relation p_L = A * (p/p_th)^((d+1)/2) where A is a constant (approximately 0.03 for the surface code), solve for d given p (measured physical error rate) and p_L (target logical error rate). Example: p = 0.1%, p_th = 1%, target p_L = 1e-12 requires d = 23, using about 1058 physical qubits per logical qubit.
3. Design the surface code layout on the physical chip. Each data qubit couples to 4 neighboring ancilla qubits (2 X-type stabilizers, 2 Z-type). The ancilla qubit measures a stabilizer each syndrome extraction round using a sequence of 4 CNOT gates. The CNOT ordering matters for hook errors; use the standard ordering that avoids weight-2 hook errors along the diagonal.
4. Plan the boundary conditions and logical operations. Smooth and rough boundaries define the logical X and Z operators. A logical CNOT between two surface code patches uses lattice surgery (measuring a joint stabilizer between patches). Magic state injection requires a smaller surface code patch to prepare and distill magic states for T gates.
5. Estimate the total physical qubit overhead for the target algorithm. Count: logical data qubits (from the algorithm), logical ancilla qubits (for Toffoli decomposition), magic state factories (each factory is a mini surface code producing one T state every few code cycles, requiring 15*d_factory^2 physical qubits). A useful quantum computation (e.g., factoring a 2048-bit number) requires millions of physical qubits at current error rates.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
