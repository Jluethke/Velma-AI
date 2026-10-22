# Divertor And Pfc Design

Design the divertor configuration and plasma-facing components for power exhaust, impurity control, and particle removal under extreme heat and neutron flux.

## Inputs

- `toroidal-field`: On-axis toroidal field in Tesla
- `plasma-current`: Plasma current in MA
- `major-radius`: Major radius in meters
- `minor-radius`: Minor radius in meters

## Outputs

- `divertor-configuration`: Divertor geometry, target material, and cooling design
- `pfc-specifications`: Plasma-facing component material, armor thickness, and coolant parameters
- `power-exhaust-strategy`: Radiated power fraction, seeding gas, and detachment strategy

## Process

1. Calculate scrape-off layer power width lambda_q from the Eich scaling: lambda_q (mm) ~ 1.35 * (Bp,omp)^-1.05 where Bp,omp is poloidal field at the outboard midplane. For ITER-scale, lambda_q is only 1-5 mm.
2. Determine power flux to the divertor target: q_peak = P_SOL * f_expansion / (2*pi*R_strike * lambda_q * f_x) where f_x is the flux expansion factor from midplane to target, typically 5-10 for a long-leg divertor.
3. Select divertor target material. Tungsten: high melting point (3422C), low sputtering yield, but brittle and activates. Carbon (CFC): no melting, but tritium retention is unacceptable for reactor. Tungsten is the current baseline.
4. Design for detachment: seed impurities (nitrogen, neon, argon) into the divertor to radiate 80-95% of the power before it reaches the target. Monitor detachment with spectroscopy and Langmuir probes. The detachment window must be wide enough for control.
5. Design PFC cooling: high-pressure water (4 MPa, 150C inlet) or helium (8 MPa) in monoblock geometry. Tungsten armor brazed to CuCrZr heat sink with a Cu interlayer. Critical heat flux margin must exceed 1.5x for steady state.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
