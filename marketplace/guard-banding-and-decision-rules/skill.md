# Guard Banding And Decision Rules

Apply guard-banding to pass/fail decisions when measurement uncertainty is significant relative to the product tolerance, controlling both consumer risk and producer risk.

## Inputs

- `test-uncertainty-ratio`: TUR for each measurement, identifying those needing guard-banding
- `calibration-intervals`: Established calibration program ensuring instruments are within specification

## Outputs

- `guard-band-limits`: Adjusted acceptance limits for each measurement: guard-banded acceptance limit = specification limit - (guard band offset), with the offset method and values documented
- `risk-analysis`: Calculated consumer risk (probability of accepting an out-of-spec unit) and producer risk (probability of rejecting an in-spec unit) for each guard-banded measurement
- `calibration-program-summary`: Complete calibration program documentation: instruments, intervals, traceability, guard-bands, environmental requirements, and procedures

## Process

1. For TUR 4:1 or better: no guard-banding needed. Simple acceptance at the specification limits gives consumer risk below 2.5% (per ANSI/NCSL Z540.3 default).
2. For TUR between 2:1 and 4:1: apply a simple guard-band by moving the acceptance limit inward by the expanded uncertainty. Acceptance limit = specification limit - U. This reduces consumer risk (chance of passing a bad unit) at the cost of increased producer risk (chance of failing a good unit).
3. For TUR below 2:1: the measurement is too uncertain for meaningful pass/fail decisions. Either improve the measurement (better instrument, more averaging, controlled environment) or accept the measurement as information-only and use it for process monitoring rather than product acceptance.
4. Consider asymmetric guard-banding when the consequences of consumer risk and producer risk are different. For safety-critical parameters, guard-band aggressively (low consumer risk, accept higher producer risk). For cosmetic or non-critical parameters, guard-band lightly (balanced risks).
5. Document the complete calibration program: instrument inventory with serial numbers, calibration intervals and next due dates, calibration procedures (or references to them), environmental requirements during calibration (temperature 23 plus or minus 2C, humidity below 70% is typical), guard-band policies by measurement type, and the process for handling out-of-tolerance findings (recall and re-test all product measured since the last good calibration).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
