# Tensile Necking Assessor

Assess necking behavior and ductile-to-brittle failure characteristics from the stress-strain curve shape.

## Inputs

- `stress-strain-curves`: Engineering stress vs engineering strain per specimen
- `uts-values`: UTS per specimen to identify post-UTS region

## Outputs

- `necking-assessment`: Onset strain, reduction in area if measured, and failure mode classification
- `true-stress-strain`: True stress vs true strain curves computed up to necking onset

## Process

1. Identify the necking onset as the point where engineering stress begins to decrease after UTS
2. Compute the post-UTS elongation as a measure of necking extent
3. Convert engineering curves to true stress-strain up to the necking onset
4. Classify failure mode as ductile (cup-cone), brittle (flat fracture), or mixed

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
