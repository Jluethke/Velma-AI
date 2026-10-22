# Pointing Requirements And Disturbances

Set pointing accuracy, knowledge, and stability requirements and quantify the environmental disturbance torques.

## Inputs

- `mission_pointing_needs`: Required pointing accuracy, knowledge, and jitter for the payload.
- `orbit_parameters`: Altitude and environment that set disturbance magnitudes.
- `spacecraft_geometry`: Inertia, area, and center-of-pressure to center-of-mass offset.

## Outputs

- `pointing_budget`: Accuracy, knowledge, and stability allocation across the control system.
- `disturbance_torques`: Gravity-gradient, solar, aerodynamic, and magnetic torque magnitudes.
- `momentum_accumulation`: Cyclic and secular momentum buildup per orbit.

## Process

1. State accuracy (for example 0.05 deg), knowledge (0.01 deg), and jitter (arcsec over an integration time) as separate line items that sum in the error budget.
2. Gravity-gradient torque Tgg = (3 * mu / (2 * r^3)) * |Iz - Iy| * sin(2*theta); it is the dominant disturbance for many low-orbit bodies.
3. Solar-radiation-pressure torque = P * A * (1 + reflectance) * (cp-cg offset), with solar pressure P near 4.5e-6 N/m^2 at 1 AU; it dominates at geostationary altitude.
4. Aerodynamic torque in low orbit = 0.5 * rho * v^2 * Cd * A * (cp-cg offset); atmospheric density rho falls sharply with altitude and varies with solar activity.
5. Separate cyclic torques (average to zero each orbit, stored in wheels) from secular torques (accumulate, must be unloaded) to size both the wheels and the unloading system.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
