# Fermentation Data Logger

Log fermentation time-course data: biomass (OD or dry weight), substrate concentrations, product concentrations, pH, dissolved oxygen, and temperature.

## Inputs

- `raw-measurements`: Time-stamped measurements from sampling and on-line sensors
- `fermentation-conditions`: Organism, medium composition, aeration, agitation, and control setpoints

## Outputs

- `time-course-data`: Structured table: time, biomass, substrate(s), product(s), pH, DO, temperature
- `data-quality-flags`: Missing samples, out-of-range readings, and sensor drift notes

## Process

1. Collect all time-point measurements into a single table indexed by time.
2. Convert OD readings to biomass concentration using a pre-determined calibration curve.
3. Flag any missing samples, readings outside the sensor range, or suspected contamination events.
4. Interpolate missing values for minor gaps; flag larger gaps as data holes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
