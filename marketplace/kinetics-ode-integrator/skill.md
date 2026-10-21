# Kinetics Ode Integrator

Numerically integrate the ODE system to produce concentration-time profiles for all species.

## Inputs

- `ode-system`: Rate equations
- `estimated-constants`: Fitted rate constants
- `initial-conditions`: Starting concentrations of all species

## Outputs

- `concentration-profiles`: Time-resolved concentrations for all species
- `integration-diagnostics`: Solver step size, stiffness flags, and mass conservation check

## Process

1. Select the integrator based on stiffness (explicit for non-stiff, BDF or Radau for stiff systems).
2. Set absolute and relative tolerances tight enough for the required precision.
3. Integrate and check mass conservation at each output time.
4. Flag any negative concentrations or solver failures.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
