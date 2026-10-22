# Fiber Installation Testing

Test and commission the installed fiber plant using OTDR, power meter, and specialized measurements to verify it meets design specifications.

## Inputs

- `power-budget-table`: Expected loss budget for comparison
- `fiber-type-selection`: Installed fiber type and cable details
- `link-distance`: Expected span lengths

## Outputs

- `otdr-trace-analysis`: Verified splice losses, connector losses, fiber attenuation per span
- `insertion-loss-report`: End-to-end optical loss measured vs budget
- `acceptance-verdict`: Pass/fail against installation specifications with any remediation needed

## Process

1. Perform OTDR testing from both ends of each span. The OTDR sends pulses and measures backscattered light versus time (distance). Select pulse width for resolution vs range trade-off: short pulses (5-10ns) resolve closely spaced events but have less dynamic range; long pulses (1-10us) see further but blur events closer than 50-500m. Use launch and receive fiber coils (150-500m) to characterize the near-end and far-end connectors.
2. Analyze the OTDR trace. Identify each event: connectors appear as reflective peaks (return loss should be > 45dB for APC, > 35dB for UPC). Fusion splices appear as loss-only events (target < 0.1dB). Unexpected events (macrobends, stress points, possible cracks) appear as non-reflective losses at unexpected locations. Bidirectional averaging removes the directional bias of Rayleigh backscatter.
3. Measure end-to-end insertion loss with a calibrated source and power meter (OLTS). This is the definitive loss measurement (OTDR gives per-event detail but less accurate total loss). Compare against the power budget. The measured loss must be less than the budgeted cable plant loss.
4. For high-speed systems, measure return loss (ORL) end-to-end. Target < -30dB for analog and coherent systems (high return loss causes multipath interference). Individual connectors contributing high reflections are identified from the OTDR trace.
5. Document results in an acceptance report. Each span: OTDR trace (both directions), insertion loss, return loss, fiber length. Compare every measured value against the specification (typically an industry standard or the design power budget with margin). Failed splices or connectors must be re-done and re-tested.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
