# Safety Integrity Level Determination

Determine the required safety integrity level for each safety function based on hazard severity, exposure, and controllability using the applicable standard's method.

## Inputs

- `hazard-list`: Classified hazards
- `safety-requirements`: Safety requirements for each hazard

## Outputs

- `safety-functions`: Each safety function defined: what it does, what hazard it mitigates, its required performance (response time, reliability), and its independence from the function it monitors
- `integrity-levels`: SIL (IEC 61508: SIL 1 to SIL 4), ASIL (ISO 26262: ASIL A to ASIL D), or DAL (ARP4754A: DAL A to DAL E) assigned to each safety function, with the derivation showing severity, exposure, and controllability inputs
- `target-failure-rates`: Maximum allowable dangerous failure rate for each safety function at its integrity level: SIL 1 = 1E-5 to 1E-6 per hour, SIL 2 = 1E-6 to 1E-7, SIL 3 = 1E-7 to 1E-8, SIL 4 = 1E-8 to 1E-9

## Process

1. Define safety functions: a safety function is a specific function that prevents or mitigates a hazard. It is not the entire system. 'Emergency braking' is a safety function. 'Brake system' is a subsystem that may contain multiple safety functions and non-safety functions.
2. For ISO 26262, determine ASIL using the three-factor method: Severity (S0-S3, from the PHA), Exposure (E1-E4: E1 = very low probability of operating scenario, E4 = high probability), and Controllability (C1-C3: C1 = simply controllable, C3 = difficult to control). The combination table yields ASIL A through D or QM (quality management, no safety integrity requirement).
3. For IEC 61508, determine SIL using risk graphs or LOPA (Layers of Protection Analysis). The risk graph considers consequence severity, frequency of exposure, avoidance possibility, and demand rate. LOPA is more quantitative: start with the unmitigated event frequency, subtract the risk reduction from each independent protection layer, and verify the residual risk meets the tolerable risk target.
4. Map the integrity level to design requirements. Higher SIL/ASIL requires: more rigorous development process (V-model at all levels), higher diagnostic coverage (the fraction of dangerous failures detected by self-test), architectural constraints (redundancy at SIL 3 and above), and independent assessment. The integrity level drives the engineering effort and must be determined early.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
