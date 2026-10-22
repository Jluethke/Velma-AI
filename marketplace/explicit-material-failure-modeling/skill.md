# Explicit Material Failure Modeling

Select and calibrate material models with failure criteria for predicting fracture, fragmentation, and energy absorption.

## Inputs

- `impact-scenario`: Materials involved, strain rates expected, and failure modes to capture
- `explicit-setup`: Time scale and loading severity

## Outputs

- `material-cards`: Complete material model definitions with strain-rate dependence and failure criteria parameters
- `failure-model-calibration`: How failure parameters were determined and their experimental basis

## Process

1. For metals under impact: Johnson-Cook constitutive model captures strain hardening, strain rate hardening, and thermal softening: sigma = (A + B*epsilon^n) * (1 + C*ln(epsilon_dot/epsilon_dot_0)) * (1 - T*^m). Parameters A, B, n, C, m from tensile tests at multiple strain rates and temperatures.
2. For metal failure: Johnson-Cook damage model accumulates damage D = sum(delta_epsilon / epsilon_f) where the failure strain epsilon_f depends on stress triaxiality, strain rate, and temperature. When D reaches 1.0, the element is deleted (eroded). Element erosion creates free surfaces and allows crack propagation.
3. For polymers and foams: use tabulated stress-strain curves with rate dependence (input multiple curves at different strain rates, the solver interpolates). Crushable foam models (Deshpande-Fleck) for energy-absorbing foams. Ogden hyperelastic with Mullins effect for rubber.
4. For composites under impact: progressive damage models (Hashin, Larc) with element property degradation. When a failure criterion is met in a ply (fiber tension, fiber compression, matrix tension, matrix compression), the corresponding stiffness is reduced to near zero. Full element deletion occurs when all plies have failed in all modes.
5. Validate the material model against a simple impact test (Taylor impact, ballistic limit, Charpy) before using it in the full simulation. The calibrated model should reproduce the experimental deformation shape, force-displacement curve, and failure pattern.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
