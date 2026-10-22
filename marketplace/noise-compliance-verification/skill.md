# Noise Compliance Verification

Verify that installed noise treatments meet the target through post-installation measurement and document compliance.

## Inputs

- `treatment-design`: Installed noise control treatments
- `noise-target`: Target noise level or reduction requirement
- `predicted-reduction`: Expected noise level after treatment

## Outputs

- `compliance-report`: Measured noise levels at receiver locations with comparison to target, including measurement uncertainty
- `insertion-loss-verification`: Measured insertion loss of each treatment compared to predicted values
- `residual-noise-budget`: Updated noise budget showing remaining sources and paths for further reduction if needed

## Process

1. Measure noise levels at the receiver locations under the same operating conditions as the original survey. Use the same instruments, positions, and measurement duration.
2. Compare before-and-after spectra to determine actual insertion loss of each treatment. Measure with treatments installed and, where practical, with treatments temporarily removed to confirm the insertion loss is from the treatment, not from other changes.
3. Verify compliance against the target at each required location and condition. Apply measurement uncertainty (typically +/- 2 dB for environmental measurements per ISO 9612).
4. If the target is not met, re-examine the noise budget. The residual noise identifies which path now dominates. Often a flanking path or an untreated penetration limits performance.
5. Document the final compliance state with calibrated measurement data, instrument certificates, environmental conditions, and operating conditions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
