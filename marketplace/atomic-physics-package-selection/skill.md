# Atomic Physics Package Selection

Select the atomic frequency standard technology by matching stability and accuracy requirements to physics package capability.

## Inputs

- `stability-requirement`: Required Allan deviation at specified averaging times (1s, 100s, 1 day)
- `application-constraints`: Size, weight, power, cost, and environmental constraints

## Outputs

- `clock-technology-selection`: Selected technology (Rb cell, Cs beam, H maser, CSAC, optical) with performance justification
- `physics-package-parameters`: Key parameters: transition frequency, line Q, shot noise limit, SWaP

## Process

1. Define the stability requirement as Allan deviation (ADEV) at the relevant averaging times. Short-term (1-100s): important for radar, communications, and navigation. Medium-term (100s-1 day): important for holdover during GNSS denial. Long-term (>1 day): important for timekeeping and calibration.
2. Map requirements to technology. CSAC (chip-scale): ADEV ~3e-10 at 1s, 3e-12 at 1000s, <120 mW, 35 cc. Rb cell (LPRO): ADEV ~1e-11 at 1s, 1e-13 at 1 day, 5-20W. Cs beam (5071A class): ADEV ~1e-11 at 1s, accuracy ~5e-13 no drift. H maser (active): ADEV ~1e-13 at 1s, 3e-16 at 1000s, best short-term stability. Optical: ADEV ~1e-15 at 1s, research/lab.
3. Consider drift. Rubidium has a frequency drift of 1e-11 to 1e-12 per month due to buffer gas permeation and light shift aging. Cesium beam has no drift (primary standard). Hydrogen maser drifts slowly (~1e-15/day) due to cavity pulling. For holdover applications, drift limits the useful free-running period.
4. Evaluate environmental sensitivity. Temperature coefficient: Rb ~1e-10/C (uncompensated), Cs ~1e-14/C. Vibration sensitivity (g-sensitivity): quartz ~1e-9/g, Rb ~1e-11/g, Cs ~1e-13/g. Magnetic field: all atomic clocks have Zeeman sensitivity, requiring shielding (mu-metal) and internal C-field control.
5. Document the selection with a comparison table showing each technology against the requirements, identifying the selected technology and the reasons for rejecting alternatives.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
