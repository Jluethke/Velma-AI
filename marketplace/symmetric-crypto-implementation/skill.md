# Symmetric Crypto Implementation

Implement AES in hardware and software with trade-offs between speed, area, power, and side-channel resistance: table-based, bitsliced, round-unrolled, iterative, and pipelined architectures.

## Inputs

- `performance-requirements`: Throughput target (Gbps or cycles per block), latency constraint, area/power budget
- `security-requirements`: Side-channel resistance level, fault resistance, certification target

## Outputs

- `symmetric-implementation`: AES implementation with architecture choice, resource utilization, performance metrics, and side-channel properties
- `implementation-trade-off-analysis`: Comparison of candidate architectures by throughput, latency, area, power, and security

## Process

1. Software implementations: Table-based (T-tables): precompute SubBytes+ShiftRows+MixColumns into four 256-entry 32-bit lookup tables. Fast (1 table lookup per byte per round) but vulnerable to cache-timing attacks (table access pattern depends on key). Bitsliced: represent the AES state as 128 individual bit-slices across registers, implement SubBytes as a sequence of Boolean operations. Constant-time (no data-dependent memory access) but throughput depends on register width (processes multiple blocks in parallel).
2. Hardware implementations: Iterative (one round per clock cycle): 10 cycles for AES-128, moderate area, moderate throughput. Round-unrolled (all 10 rounds combinational): single-cycle latency, highest throughput, largest area. Pipelined (one round per pipeline stage): 10-stage pipeline, highest throughput at the cost of 10-cycle latency and pipeline registers. Sub-pipelined for higher clock frequency.
3. For side-channel resistance in hardware: implement SubBytes as combinational logic (not ROM/LUT to avoid data-dependent timing). Use registers between combinational stages (no glitch propagation). For masked implementation: split each byte into shares, implement a masked S-box (Canright or tower-field decomposition with domain-oriented masking).
4. Key schedule: can be computed on-the-fly (saves area, round key derived each cycle from previous) or precomputed and stored (saves time for repeated encryptions with same key, costs 11x16 = 176 bytes storage for AES-128). For hardware, on-the-fly is typical for area-constrained designs.
5. Verify: functional correctness against NIST test vectors (FIPS 197 Appendix B). Performance measurement: cycles per block (software), throughput and area (hardware). Side-channel: run TVLA on hardware implementation, verify constant-time execution for software (using tools like ctgrind or timecop).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
