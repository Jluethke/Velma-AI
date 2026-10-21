# Wind Tunnel Correction Applier

Apply standard corrections for wall interference, support tare, blockage, and buoyancy.

## Inputs

- `raw-forces-moments`: Uncorrected six-component data
- `tunnel-geometry`: Test section dimensions, slot or solid walls, support strut geometry

## Outputs

- `corrected-forces-moments`: Forces and moments with all corrections applied
- `correction-breakdown`: Magnitude of each correction for traceability

## Process

1. Subtract support strut tare loads measured with the metric part removed
2. Apply solid blockage and wake blockage corrections based on model and wake size
3. Correct for streamline curvature (wall interference) on lift, pitching moment, and angle of attack
4. Apply buoyancy correction for static pressure gradient along the test section

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
