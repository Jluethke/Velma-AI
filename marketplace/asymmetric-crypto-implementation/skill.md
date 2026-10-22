# Asymmetric Crypto Implementation

Implement RSA and ECC with modular arithmetic optimized for the target platform, and with countermeasures against timing, power, and fault attacks.

## Inputs

- `symmetric-implementation`: Symmetric crypto implementation and trade-off analysis
- `implementation-trade-off-analysis`: Architecture comparison methodology

## Outputs

- `asymmetric-implementation`: RSA and ECC implementations with performance metrics, side-channel properties, and fault resistance
- `constant-time-verification`: Evidence that implementation is constant-time: no secret-dependent branches, no secret-dependent memory access, no secret-dependent loop counts

## Process

1. Modular arithmetic core: Montgomery multiplication (modular multiplication without division, using shifts and additions). For RSA-2048: multiply 2048-bit numbers modulo N. Implementation: word-level Montgomery (schoolbook for small multipliers, Karatsuba for larger), or systolic array for hardware. Barrett reduction as alternative (precomputes reciprocal of modulus).
2. RSA: implement modular exponentiation using square-and-multiply. Vulnerable to SPA (square vs multiply pattern reveals exponent bits). Countermeasure: Montgomery ladder (always perform both square and multiply, select which result to keep). Add blinding: multiply input by r^e (random r) before exponentiation, divide result by r after, so the intermediate values are randomized against DPA.
3. ECC scalar multiplication: compute k*P where k is the secret scalar and P is the base point. Double-and-add algorithm (analogous to square-and-multiply) is vulnerable to SPA. Montgomery ladder for constant-time: always perform both point addition and point doubling. Use complete addition formulas (unified formulas that work for all input cases, avoiding exceptional-case branches).
4. Constant-time programming rules: (1) No branches conditioned on secret data (use conditional moves or arithmetic masking). (2) No array indexing with secret-dependent index (use constant-time table lookup: scan entire table and select with bitwise mask). (3) No variable-time instructions on secret data (division, some multiplies on some architectures). (4) Compile with optimization flags that preserve constant-time properties (verify assembly output).
5. Verify: functional correctness against test vectors (NIST CAVP for RSA, RFC 7748 / FIPS 186-5 for ECC). Constant-time verification: run under valgrind with secret data marked as uninitialized (ctgrind), or use dudect for statistical timing analysis. Fault resistance: verify point validation (reject points not on the curve), verify output consistency (re-derive and compare).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
