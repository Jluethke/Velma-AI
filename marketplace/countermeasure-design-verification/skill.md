# Countermeasure Design Verification

Design side-channel countermeasures for the target implementation, implement them, and verify their effectiveness through TVLA leakage assessment and repeat attacks on the protected implementation.

## Inputs

- `attack-results`: Key recovery results on unprotected implementation
- `leakage-model`: Identified leakage model and SNR

## Outputs

- `countermeasure-design`: Selected countermeasures with implementation specification and overhead analysis
- `tvla-assessment`: Test Vector Leakage Assessment results: t-test values per sample point, pass/fail verdict at 4.5 threshold, number of traces used

## Process

1. Select countermeasure class based on attack results and performance budget. Masking (Boolean or arithmetic): splits each sensitive variable into d+1 shares where d is the protection order. First-order masking stops first-order DPA but not higher-order attacks. Overhead: roughly (d+1)^2 for d-th order masking in area and time.
2. Hiding countermeasures: add random delays (shuffle operation order within a round), insert dummy operations, randomize execution timing. Less provably secure than masking but lower overhead. Amplitude hiding: add noise generators on the power supply.
3. Implement the selected countermeasure. For masking: verify that no intermediate computation combines shares in a way that leaks (formal verification with tools like maskVerif, Rebecca, or SILVER). For shuffling: verify uniform distribution of permutations.
4. Run TVLA (Goodwill et al., 2011): acquire fixed-vs-random trace sets (10,000+ traces each). Compute Welch's t-test at each sample point. If |t| > 4.5 at any point, the implementation leaks (false positive probability < 0.00001 per point). Non-specific t-test detects any first-order leakage without knowing the leakage model.
5. If TVLA passes, repeat the CPA attack on the protected implementation with 10x to 100x the original trace count. Verify that the guessing entropy does not converge to rank 1 within the trace budget. Document the security margin: estimated minimum traces for key recovery on the protected implementation vs. the unprotected baseline.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
