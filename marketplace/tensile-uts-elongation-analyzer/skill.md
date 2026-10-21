# Tensile Uts Elongation Analyzer

Extract ultimate tensile strength and elongation at break from each stress-strain curve.

## Inputs

- `stress-strain-curves`: Engineering stress vs engineering strain per specimen
- `test-metadata`: Strain rate and temperature for context

## Outputs

- `uts-values`: Ultimate tensile strength per specimen
- `elongation-at-break`: Percent elongation at fracture per specimen

## Process

1. Find the maximum stress point on each curve to determine UTS
2. Identify the fracture point as the terminal data point or the point of sudden load drop
3. Compute total elongation at break as the strain at fracture times 100
4. Flag any specimens that fractured outside the gauge section

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
