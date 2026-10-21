# Tensile Curve Importer

Import raw tensile test data and convert force-displacement to engineering stress-strain.

## Inputs

- `raw-test-files`: Machine output files with force, displacement, and time
- `specimen-dimensions`: Gauge length, cross-sectional area, and geometry for each specimen

## Outputs

- `stress-strain-curves`: Engineering stress vs engineering strain for each specimen
- `test-metadata`: Strain rate, temperature, machine compliance correction applied

## Process

1. Parse raw force-displacement data from the testing machine format
2. Apply machine compliance correction if a compliance calibration is provided
3. Convert force to engineering stress and displacement to engineering strain using specimen dimensions
4. Align curves to zero stress and zero strain at the origin

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
