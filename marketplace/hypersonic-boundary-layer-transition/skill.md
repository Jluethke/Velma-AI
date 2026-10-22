# Hypersonic Boundary Layer Transition

Predict where the boundary layer transitions from laminar to turbulent on a hypersonic vehicle, which determines where heating rates jump by a factor of 3 to 8.

## Inputs

- `shock-geometry`: Shock shape and post-shock state from shock analysis
- `vehicle-geometry`: Surface geometry, roughness map, and any protuberances
- `flight-conditions`: Mach, altitude, angle of attack

## Outputs

- `transition-location-map`: Predicted transition location on each surface with uncertainty bounds
- `transition-mechanism`: Dominant instability mechanism at each location (first mode, second mode, crossflow, roughness-induced)

## Process

1. Compute boundary layer edge conditions from the inviscid solution: local Mach number, temperature, pressure, and unit Reynolds number along the body.
2. Apply the eN method: compute the growth rate of disturbances (first mode: oblique waves dominant below about Mach 4; second mode: acoustic trapped waves dominant above Mach 4) using linear stability theory or correlations.
3. Integrate amplification factors along the surface. Transition is predicted where the N-factor reaches a critical value (N = 5 to 10, calibrated to flight or ground test data for the specific environment).
4. Assess crossflow instability on swept surfaces: compute the crossflow Reynolds number and compare to critical values (Re_cf ~ 200 for stationary vortices).
5. Evaluate roughness effects: for distributed roughness, apply the roughness Reynolds number criterion (Re_kk > 200 for isolated roughness to trip boundary layer). For discrete protuberances, use the Berry-Horvath correlation.
6. Apply a factor-of-two uncertainty band on transition location for preliminary design. Note that ground test facilities introduce noise that does not exist in flight, making ground-to-flight transition correlation a known challenge.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
