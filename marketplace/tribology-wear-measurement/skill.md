# Tribology Wear Measurement

Measure wear volume, surface roughness, and morphology after the tribology test.

## Inputs

- `prepared-specimens`: Pre-test baseline for comparison
- `friction-time-series`: Context for understanding wear mechanisms

## Outputs

- `wear-measurements`: Wear volume, specific wear rate, and post-test surface roughness
- `wear-morphology`: Optical and SEM images of wear tracks showing the dominant wear mechanism

## Process

1. Profile the wear track or scar using a profilometer or optical interferometer.
2. Compute wear volume from the track cross-section and length (or mass loss if measured).
3. Calculate the specific wear rate: volume lost per unit load per unit sliding distance.
4. Image the wear track to identify the wear mechanism (abrasive, adhesive, oxidative, fatigue).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
