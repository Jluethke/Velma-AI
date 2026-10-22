# Junction Temperature Measurement

Measure semiconductor junction temperature using electrical methods (forward voltage, thermal transient) that access the die temperature directly rather than measuring the package surface.

## Inputs

- `hotspot-identification`: Components requiring junction temperature measurement (those running hottest or closest to thermal limits)
- `thermal-images`: Surface temperature data for thermal resistance calculation

## Outputs

- `junction-temperature-data`: Measured junction temperatures for each target device under operating conditions
- `thermal-resistance-measurements`: Measured theta-JA (junction-to-ambient) and theta-JC (junction-to-case) for comparison with datasheet values and thermal model validation
- `thermal-derating-assessment`: Operating junction temperature margin for each device relative to its maximum rated Tj, with recommended derating per reliability guidelines

## Process

1. For diodes and MOSFETs with accessible body diodes, use the forward voltage method. First calibrate: sweep the device through a range of known temperatures (oven or thermal chamber) while measuring forward voltage at a low sense current (100uA to 1mA). Record the Vf vs temperature relationship (typically -1.5 to -2.5 mV/C for silicon). This is the temperature-sensitive electrical parameter (TSEP).
2. To measure junction temperature during operation: apply the operating power to heat the device to steady state. Then rapidly switch from operating power to the low sense current and measure Vf within microseconds (before the junction cools). The Vf reading, converted through the calibration curve, gives the junction temperature at the instant power was removed.
3. For thermal transient measurement (structure function analysis): heat the device to steady state, then switch off power and sample the cooling curve at high resolution (microsecond time steps for the first millisecond, then progressively longer intervals). The cooling curve shape reveals the thermal resistance structure from junction through die attach, package, and board to ambient.
4. Calculate thermal resistance: theta-JC = (Tj - Tcase) / Pdiss, where Tcase is measured by thermocouple on the package. theta-JA = (Tj - Tambient) / Pdiss. Compare measured values to the datasheet. If measured theta-JA is higher than the datasheet value, the board thermal design is worse than the datasheet test condition (usually a JEDEC standard test board with specific copper area).
5. Assess derating: most semiconductor reliability guidelines recommend operating at least 20-30C below the rated maximum junction temperature. For components running near the limit, calculate the temperature rise above ambient and identify the thermal path improvement needed (more copper, thermal vias, heat sink, improved airflow) to achieve adequate margin.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
