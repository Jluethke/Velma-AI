# Aerodynamic Coefficient Calculator

Compute non-dimensional aerodynamic coefficients from corrected forces and freestream conditions.

## Inputs

- `corrected-forces-moments`: Corrected six-component data
- `model-reference`: Reference area, span, and mean aerodynamic chord

## Outputs

- `aero-coefficients`: CL, CD, CM, CY, Cl, Cn at each angle of attack
- `derived-quantities`: Lift-to-drag ratio, Oswald efficiency, and lift curve slope

## Process

1. Non-dimensionalize forces by dynamic pressure and reference area
2. Non-dimensionalize moments by dynamic pressure, reference area, and reference length
3. Compute derived quantities: L/D, dCL/dalpha, and induced drag factor
4. Tabulate all coefficients at each angle of attack

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
