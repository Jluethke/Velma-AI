# Radiometric Sample Preparer

Prepare the sample for isotopic measurement by the selected dating system.

## Inputs

- `dating-system`: Selected radiometric system
- `sample-description`: Raw sample material

## Outputs

- `prepared-aliquot`: Sample prepared for mass spectrometry (dissolved, separated, spiked)
- `preparation-log`: Steps taken, blank levels, spike calibration, and yield

## Process

1. Separate the target mineral phase if needed (zircon, sanidine, whole rock)
2. Dissolve the sample and add isotopic tracer (spike) for concentration measurement
3. Perform chemical separation to isolate the parent and daughter elements
4. Measure procedural blanks to assess contamination

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
