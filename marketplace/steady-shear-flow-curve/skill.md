# Steady Shear Flow Curve

Measure the steady-state shear viscosity as a function of shear rate to characterize shear-thinning, shear-thickening, or Newtonian behavior.

## Inputs

- `loaded-sample`: Material loaded in the selected geometry, conditioned and at temperature
- `shear-rate-range`: Shear rate sweep range and number of points

## Outputs

- `flow-curve-data`: Viscosity and shear stress vs shear rate
- `flow-behavior-classification`: Newtonian, shear-thinning, shear-thickening, or yield stress behavior

## Process

1. Run a logarithmic shear rate sweep from low to high rates with steady-state detection at each point
2. Verify time independence by running a reverse sweep (high to low) and checking for hysteresis
3. Plot viscosity vs shear rate on log-log axes and shear stress vs shear rate
4. Classify the flow behavior and identify the zero-shear viscosity and power-law region if applicable

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
