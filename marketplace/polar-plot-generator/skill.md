# Polar Plot Generator

Generate drag polar, lift curve, and moment curve plots from aerodynamic coefficients.

## Inputs

- `aero-coefficients`: CL, CD, CM at each angle of attack
- `comparison-data`: Reference data from previous tests or published results if available

## Outputs

- `aerodynamic-plots`: Drag polar (CL vs CD), lift curve (CL vs alpha), moment curve (CM vs alpha)
- `stall-characteristics`: CLmax, stall angle, and pitching moment break

## Process

1. Plot the drag polar (CL vs CD) with the ideal parabolic drag polar overlaid
2. Plot the lift curve (CL vs alpha) and determine CLmax and stall angle
3. Plot the pitching moment curve and identify the aerodynamic center or neutral point
4. Overlay comparison data if provided and annotate differences

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
