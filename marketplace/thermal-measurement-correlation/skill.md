# Thermal Measurement Correlation

Correlate simulation results to physical measurements by placing thermocouples and IR cameras correctly, understanding measurement uncertainty, and adjusting model parameters within physically justified bounds.

## Inputs

- `converged-mesh-settings`: Validated mesh settings
- `mesh-quality-metrics`: Mesh quality confirmation

## Outputs

- `measurement-plan`: Thermocouple placement locations, IR camera setup parameters, and measurement procedure with uncertainty estimates
- `correlation-results`: Side-by-side comparison of simulation vs measurement at each point, with root cause analysis for any discrepancies exceeding the target

## Process

1. Place thermocouples at simulation monitoring points. Use Type T (copper-constantan) for electronics temperature range (accuracy plus or minus 0.5C). Attach with thermally conductive epoxy or Kapton tape, ensuring the wire runs along an isotherm for at least 20 wire diameters to minimize conduction error along the leads.
2. For IR camera measurements: calibrate emissivity at each surface. Bare copper is 0.03-0.07 (nearly invisible to IR), black anodized aluminum is 0.85-0.95, PCB solder mask is 0.85-0.92. Apply a thin layer of known-emissivity paint (matte black, epsilon = 0.95) to critical measurement areas. Account for reflected IR from nearby hot surfaces.
3. Run the physical test under controlled conditions. Let the system reach steady state (monitor thermocouple readings until slope is less than 0.1C per minute for 10 minutes). Record ambient temperature at the system inlet, not just room temperature.
4. Compare simulation to measurement at each point. Accept discrepancies under 5C (or 10% of temperature rise, whichever is larger). For larger discrepancies: check contact resistances (most common source of error), verify power dissipation values with actual current and voltage measurements, and confirm airflow boundary conditions match reality.
5. Adjust model parameters within physically justified bounds only. Contact resistance is the typical tuning parameter (can vary 2x-5x from nominal). Never adjust material thermal conductivity or component power to force a match. Document every adjustment and its justification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
