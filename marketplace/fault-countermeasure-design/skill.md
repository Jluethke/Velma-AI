# Fault Countermeasure Design

Design and verify fault injection countermeasures: redundancy, detection codes, temporal redundancy, combined protections, and evaluate residual vulnerability.

## Inputs

- `dfa-key-recovery`: Attack results showing key recovery from faults
- `fault-model-characterization`: Observed fault model and success rates

## Outputs

- `fault-countermeasure-spec`: Countermeasure design with implementation requirements, overhead analysis, and detection/correction capability
- `residual-vulnerability-assessment`: Analysis of remaining attack surface after countermeasures, including combined fault+side-channel threats

## Process

1. Spatial redundancy: duplicate the computation and compare results before output. Triple modular redundancy (TMR) with majority voting corrects single faults but costs 3x area and power. Dual redundancy with comparison detects but does not correct. For asymmetric detection: compute forward then verify with inverse operation (encrypt then decrypt and compare).
2. Temporal redundancy: execute the computation twice (or with complementary operations) sequentially and compare. Lower area cost than spatial redundancy but doubles execution time and is vulnerable to persistent faults or faults that repeat identically.
3. Information redundancy: add error detection codes to intermediate values. Parity bits detect odd-weight errors. CRC or linear codes detect broader error patterns. For AES: exploit the algebraic structure to compute check values that propagate through rounds (infection countermeasure: if fault detected, randomize the output rather than blocking it, to prevent fault sensitivity mapping).
4. Combined countermeasures: combine fault detection with side-channel masking. Faults on masked implementations can remove masks (second-order fault attack) or bypass checks. Verify that the fault countermeasure does not introduce new side-channel leakage (e.g., comparison operation leaking correct result in power trace).
5. Evaluate: repeat the fault injection campaign on the protected implementation. Measure the detection rate (percentage of injected faults that trigger the countermeasure), the false positive rate (countermeasure triggers without fault), and the residual exploitable fault rate. Target: zero exploitable faults with < 0.001% false positive rate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
