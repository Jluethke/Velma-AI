# Ess Profile Design

Design the ESS thermal cycling and vibration profiles using HALT margins to set screen parameters that precipitate manufacturing defects without consuming product life.

## Inputs

- `operating-limits`: HALT operating limits for temperature and vibration
- `destruct-limits`: HALT destruct limits
- `product-specification`: Operating specification and production volume

## Outputs

- `thermal-profile`: ESS thermal cycling profile: temperature range, rate of change, number of cycles, dwell time at extremes, functional test insertion points
- `vibration-profile`: ESS vibration profile: Grms level, frequency range, axis configuration, duration
- `screening-strength-estimate`: Calculated defect detection probability for each defect type based on the profile parameters

## Process

1. Set the ESS temperature range between the operating specification limits and the HALT operating limits. A common approach: ESS high temperature = spec max + 0.4 * (HALT operating limit - spec max), ESS low temperature = spec min - 0.4 * (spec min - HALT operating limit). This stresses beyond spec without approaching the operating limit.
2. Set the thermal rate of change as high as the chamber and product allow. Faster rates generate higher thermal gradients within the product, which precipitate solder joint and connector defects more effectively. Target at least 15C/minute; 40C/minute or higher if the product and chamber support it.
3. Set the number of thermal cycles. Use the Nelson model to calculate screening strength: S = 1 - exp(-N * f(delta_T, ramp_rate)). For typical electronics, 20 cycles at 40C/minute over a 100C range gives roughly 95% screening strength for solder joint defects. Fewer cycles are needed if the temperature range and rate are aggressive.
4. Set vibration level at 20-50% of the HALT vibration operating limit. Use broadband random vibration covering 20Hz to 2000Hz. Duration of 5-10 minutes per axis (or all axes simultaneously with a repetitive shock table). Vibration catches mechanical defects (loose fasteners, connector retention, solder joint micro-cracks) that thermal cycling alone misses.
5. Insert functional tests at the temperature extremes (hot dwell and cold dwell) and after vibration. A defect precipitated by thermal stress may only be detectable while the product is still at temperature. Testing at room temperature after the screen misses intermittent failures that manifest only at the extreme.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
