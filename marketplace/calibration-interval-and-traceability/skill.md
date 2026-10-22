# Calibration Interval And Traceability

Determine optimal calibration intervals based on instrument drift and reliability data, and establish metrological traceability to national standards through an unbroken chain.

## Inputs

- `uncertainty-budget`: Measurement uncertainty analysis showing which instruments contribute most to uncertainty
- `expanded-uncertainty`: Required measurement uncertainty to maintain

## Outputs

- `calibration-intervals`: Recommended calibration interval for each instrument with the method used to determine it (manufacturer, reliability-based, or drift-based)
- `traceability-chain`: Documented chain from each working instrument to a national measurement institute through accredited calibration laboratories
- `interval-adjustment-criteria`: Rules for extending or shortening calibration intervals based on historical calibration results

## Process

1. Start with the manufacturer's recommended calibration interval (typically 1 year). This is conservative and suitable when no historical data exists. Track the out-of-tolerance rate at each calibration: the percentage of parameters that have drifted outside their specification since the last calibration.
2. Apply reliability-based interval adjustment (per NCSL RP-1): if the out-of-tolerance rate at calibration is below 2%, extend the interval by a step (e.g., 12 months to 15 months). If above 5%, shorten the interval. If between 2% and 5%, keep the current interval. This converges on the optimal interval that maintains instrument reliability target (typically 95% in-tolerance probability).
3. For drift-based interval determination: plot the measured drift at each calibration over time. Fit a linear or quadratic drift model. Extrapolate to find when the drift would reach the specification limit. Set the calibration interval at 75% of that time to provide margin.
4. Establish traceability: each working instrument must be calibrated against a reference standard, which is itself calibrated against a higher-level standard, up to a national measurement institute (NIST, PTB, NPL). Each link in the chain must be performed by an accredited laboratory (ISO/IEC 17025) with a stated measurement uncertainty. The uncertainty grows at each level, so the working instrument's uncertainty includes the accumulated chain uncertainty.
5. Document the traceability chain for each measurement parameter, not just each instrument. A DMM measures voltage, current, and resistance, each with its own traceability path. The calibration certificate must state the measurement uncertainty for each parameter at each range, traceable to the specific reference standard and national institute.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
