# Safety Instrumented System Design

Design the safety instrumented system (SIS) to meet the required SIL from LOPA analysis.

## Inputs

- `sil-requirements`: Required SIL for each safety instrumented function
- `process-pid`: Process instrumentation and control architecture

## Outputs

- `sif-specification`: Sensor, logic solver, and final element specification for each safety function
- `pfd-calculation`: Calculated PFD average for each SIF demonstrating SIL compliance
- `proof-test-plan`: Proof test interval and procedures for each SIF component

## Process

1. Define the safety instrumented function: what is sensed, what logic is applied, and what action is taken. Each SIF is independent: it uses dedicated sensors and final elements not shared with the BPCS where the SIL requires it.
2. Select the architecture. For SIL 1: single sensor, single logic solver (safety-certified PLC), single final element (e.g., ESD valve). For SIL 2: consider 1oo2 (one out of two) voting on sensors for higher availability, or redundant final elements. SIL 3: typically requires 2oo3 voting and redundant logic solvers.
3. Calculate the average PFD using the simplified equations from IEC 61508/61511 or a Markov model. PFD_avg for a single channel = lambda_DU * T_proof / 2, where lambda_DU is the dangerous undetected failure rate and T_proof is the proof test interval. For 1oo2 architecture, PFD drops approximately to (lambda_DU * T_proof)^2 / 3.
4. Set the proof test interval so that the PFD_avg meets the SIL requirement with margin. Typical proof test intervals: 1 year for SIL 2, 6 months to 1 year for SIL 3. Partial stroke testing of valves can extend intervals by detecting a fraction of dangerous failures between full proof tests.
5. Specify the components: sensors must be SIL-capable with known failure rate data (from manufacturer's FMEDA or the exida SILStat database). Logic solver must be certified to the required SIL per IEC 61508. Final elements (valves) must fail to the safe state and have documented failure rates.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
