# Diagnostic Coverage Calculation

Calculate the diagnostic coverage of the safety system's self-test mechanisms and verify that the architecture meets the target dangerous failure rate.

## Inputs

- `safety-functions`: Defined safety functions
- `integrity-levels`: SIL/ASIL assignments
- `target-failure-rates`: Maximum dangerous failure rates

## Outputs

- `failure-mode-classification`: Each component failure mode classified as: safe (system goes to safe state), dangerous detected (self-test catches it), dangerous undetected (self-test misses it), or no effect
- `diagnostic-coverage-ratio`: DC = (dangerous detected) / (dangerous detected + dangerous undetected) for each safety function, compared against the SIL requirement (SIL 2 requires DC >= 60%, SIL 3 >= 90%)
- `proof-test-interval`: The required interval between full-scope tests that can detect the dangerous undetected failures, calculated from the SIL target and the lambda_DU rate

## Process

1. Classify every failure mode of every component in the safety function. For each failure mode, determine: does it cause the safety function to fail dangerously (output wrong when needed)? If so, is the failure detected by any automatic diagnostic (watchdog, comparator, self-test, redundancy check)? If detected, it is dangerous detected (DD). If not, it is dangerous undetected (DU).
2. Calculate the diagnostic coverage ratio: DC = lambda_DD / (lambda_DD + lambda_DU). Compare against the architectural constraints from the standard. IEC 61508 Type A (simple) subsystem at SIL 2 with 1oo1D architecture requires DC >= 60%. SIL 3 with 1oo2D requires DC >= 90%. If DC is insufficient, add diagnostics or change the architecture.
3. For dangerous undetected failures, calculate the required proof test interval. The probability of failure on demand (PFD) for a single channel with proof test interval T is approximately PFD = lambda_DU * T / 2. For the system to meet SIL 2 (PFD < 1E-2), the proof test interval must be T < 2 * PFD_target / lambda_DU. If the required interval is shorter than operationally practical, add diagnostics to convert DU failures to DD.
4. Account for common cause failures between redundant channels. For a 1oo2 architecture, the PFD including common cause is PFD = beta * lambda_DU * T / 2 + (1-beta)^2 * (lambda_DU * T)^2 / 3. The common cause beta factor often dominates the PFD for high-SIL systems, meaning that adding more redundancy has diminishing returns without addressing common cause.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
