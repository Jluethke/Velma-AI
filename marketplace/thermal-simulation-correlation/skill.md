# Thermal Simulation Correlation

Validate thermal simulation models against physical measurement and establish confidence in predictions for design decisions.

## Inputs

- `cooling-solution`: Selected cooling design
- `thermal-resistance-stack`: Predicted thermal resistances

## Outputs

- `correlation-results`: Comparison of simulated vs measured temperatures at key points, with root cause analysis for any discrepancy
- `calibrated-model`: Updated simulation model with calibrated material properties for future design iterations

## Process

1. Build the thermal test vehicle. Use a die with embedded thermal diode or resistive heater and temperature sensor. JEDEC thermal test board (JESD51-9 for BGA) or application-specific board for system-level correlation.
2. Measure theta_JA and theta_JC per JEDEC JESD51-1 (junction temperature from thermal diode, ambient or case temperature from thermocouple). Measure at multiple power levels to verify linearity.
3. Build the simulation model matching the physical test setup exactly (board dimensions, airflow boundary conditions, ambient temperature). Use manufacturer-specified material properties as starting point.
4. Compare simulation to measurement. Typical acceptable correlation: within 10% for theta_JA, within 5% for theta_JC. If outside tolerance: check TIM bond line thickness (measure by cross-section), verify material properties (especially TIM conductivity which varies with pressure and application), check for air gaps or voids.
5. Calibrate the model: adjust uncertain parameters (TIM BLT, contact resistance, heat sink fin efficiency) within physically reasonable bounds to match measurement. Document calibrated values. Use calibrated model for future design variants with confidence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
