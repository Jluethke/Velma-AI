# Safety Function Design

Design safety functions meeting the allocated SIL, including sensor, logic, and actuator selection with architectural constraints.

## Inputs

- `sil-allocation-table`: SIL per safety function
- `target-failure-measures`: PFDavg or PFH targets

## Outputs

- `safety-function-architecture`: Sensor-logic-actuator architecture per safety function with hardware fault tolerance and safe failure fraction
- `pfd-calculation`: Calculated PFDavg or PFH per safety function demonstrating SIL compliance

## Process

1. For each safety function, select the architecture by SIL: SIL 1 may use 1oo1 (single channel), SIL 2 typically 1oo1D (single with diagnostics) or 1oo2, SIL 3 requires 1oo2D or 2oo3, SIL 4 requires 2oo3 or higher with separation. The architecture must achieve the required hardware fault tolerance (HFT) and safe failure fraction (SFF).
2. Select sensor, logic solver, and actuator for each channel. Each element has a failure rate (lambda) split into dangerous detected (DD), dangerous undetected (DU), safe detected (SD), and safe undetected (SU). The SFF = (SD + SU + DD) / (SD + SU + DD + DU).
3. Calculate PFDavg or PFH for the safety function using the Markov model or simplified equations from IEC 61508 Part 6. For 1oo2 architecture: PFDavg = 2 * ((lambda_DU * T_proof)^2) / 3 + lambda_DU * MTTR (with common cause beta factor adjustment).
4. Verify the calculated PFD/PFH meets the target. If not, improve by: increasing proof test frequency (reduces T_proof), improving diagnostics (moves failures from DU to DD), adding redundancy (adds channels), or selecting higher-reliability components (reduces lambda).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
