# Magnetic Configuration Design

Design the tokamak magnetic field configuration: toroidal field strength, plasma current, safety factor profile, and aspect ratio selection.

## Inputs

- `plasma-density`: Required plasma density
- `plasma-temperature`: Required plasma temperature in keV
- `confinement-time`: Required confinement time
- `triple-product-target`: Required triple product

## Outputs

- `toroidal-field`: On-axis toroidal magnetic field in Tesla
- `plasma-current`: Plasma current in MA
- `major-radius`: Major radius R0 in meters
- `minor-radius`: Minor radius a in meters
- `safety-factor-profile`: q profile from axis to edge including q95

## Process

1. Select aspect ratio A = R/a. Conventional tokamaks use A = 2.5-4. Lower A gives higher beta but more challenging magnets on the inboard side. Spherical tokamaks use A = 1.2-1.8.
2. Set the safety factor at the 95% flux surface q95 >= 3 for MHD stability. The Kruskal-Shafranov limit requires q_edge > 1. Calculate plasma current from q95 = 5 * a^2 * B_T / (R * I_p) * (1 + kappa^2) / 2.
3. Determine toroidal field from the beta limit: beta_N = beta * a * B_T / I_p <= 2.5-3.5 (Troyon limit). Here beta = 2 * mu0 * <p> / B^2. Higher B_T allows higher pressure at same beta_N.
4. Size the machine (R0, a) by inverting the confinement scaling law with the target tau_E. This is iterative: R and a affect volume, which affects required density, which affects Greenwald limit, which constrains I_p.
5. Design the plasma shape: elongation kappa = 1.6-1.8, triangularity delta = 0.3-0.5. Higher elongation improves confinement but requires vertical stability feedback control with conducting walls and active coils.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
