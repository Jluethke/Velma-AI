# Ucs Modulus Calculator

Determine uniaxial compressive strength, Young's modulus, and Poisson's ratio from unconfined tests.

## Inputs

- `stress-strain-data`: Axial stress vs axial and lateral strain at zero confining pressure
- `specimen-metadata`: Specimen dimensions for correction

## Outputs

- `ucs-values`: Uniaxial compressive strength per specimen
- `elastic-properties`: Young's modulus and Poisson's ratio per specimen with method (tangent, secant, or average)

## Process

1. Identify peak axial stress as the uniaxial compressive strength (UCS)
2. Compute tangent Young's modulus at 50% of UCS from the axial stress-strain curve
3. Compute Poisson's ratio from the ratio of lateral to axial strain at the same stress level
4. Report mean and range across specimens

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
