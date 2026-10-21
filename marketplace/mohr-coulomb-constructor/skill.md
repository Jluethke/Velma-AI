# Mohr Coulomb Constructor

Construct the Mohr-Coulomb failure envelope from triaxial test results at multiple confining pressures.

## Inputs

- `stress-strain-data`: Peak stress at each confining pressure
- `ucs-values`: Unconfined compressive strength as the zero-confinement data point

## Outputs

- `mohr-circles`: Mohr circle diagram with failure envelope
- `failure-envelope-fit`: Linear Mohr-Coulomb fit: cohesion (c) and friction angle (phi)

## Process

1. Plot Mohr circles for each test at its sigma-1 (peak axial stress) and sigma-3 (confining pressure)
2. Fit a linear failure envelope tangent to the circles
3. Extract cohesion (c) and internal friction angle (phi) from the envelope slope and intercept
4. Assess the quality of the linear fit and note if curvature suggests Hoek-Brown is more appropriate

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
