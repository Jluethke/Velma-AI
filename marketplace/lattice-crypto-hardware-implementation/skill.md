# Lattice Crypto Hardware Implementation

Implement lattice-based cryptography in hardware: NTT (Number Theoretic Transform) architecture, modular arithmetic units, memory architecture for polynomial operations, and side-channel protected implementation.

## Inputs

- `algorithm-selection`: Selected PQC algorithms and parameter sets
- `migration-impact-analysis`: Performance and bandwidth requirements

## Outputs

- `hardware-implementation`: RTL design: NTT unit, modular arithmetic, memory controller, control FSM, with area/throughput/power metrics
- `side-channel-assessment`: Leakage evaluation of PQC implementation, countermeasures applied, TVLA results

## Process

1. NTT is the core computation: ML-KEM and ML-DSA use polynomial multiplication over Z_q[X]/(X^n+1). Direct multiplication is O(n^2). NTT converts to O(n*log(n)) by transforming polynomials to evaluation form, pointwise multiplying, and inverse-transforming. For ML-KEM-768: n=256, q=3329. NTT butterfly: a' = a + w*b mod q, b' = a - w*b mod q. The modular reduction for q=3329 can use Barrett reduction (precomputed constant) or Montgomery reduction.
2. Hardware NTT architecture: Iterative (1 butterfly unit, n*log(n) cycles, minimum area), parallel (k butterfly units, n*log(n)/k cycles), fully unrolled (all butterflies instantiated, log(n) cycles, maximum area/throughput). For FPGA: 2-4 parallel butterflies with dual-port block RAM for coefficient storage is a common area-throughput trade-off. Pipeline the butterfly: multiply in cycle 1, add/subtract in cycle 2.
3. Memory architecture: NTT requires in-place coefficient access with specific stride patterns (bit-reversal or natural order depending on the algorithm variant). Use dual-port BRAM with address generation logic that sequences through the NTT stages. Twiddle factors (precomputed powers of the NTT root) stored in a ROM or computed on-the-fly.
4. Side-channel protection: the secret key in ML-KEM decapsulation and ML-DSA signing is used in polynomial operations that can leak through power analysis. Apply masking: arithmetic masking for modular additions, Boolean masking for comparisons (especially the implicit rejection in ML-KEM decapsulation, where a timing difference between valid and invalid ciphertexts leaks information). Verify with TVLA on the hardware implementation.
5. Verification: test against NIST Known Answer Test vectors (KAT files provided with each standard). Measure throughput (key generations, encapsulations, decapsulations per second), area (LUTs, FFs, BRAM, DSP for FPGA; gate count for ASIC), and power. Compare against software baseline on the same platform to quantify the hardware acceleration factor.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
