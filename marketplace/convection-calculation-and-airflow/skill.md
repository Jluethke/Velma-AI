# Convection Calculation And Airflow

Calculate natural and forced convection heat transfer coefficients for the PCB and heat sink, and determine if the thermal design meets requirements.

## Inputs

- `heat-sink-specification`: Selected heat sink geometry
- `board-thermal-resistance`: Board thermal path resistance
- `component-power-dissipation`: Total power to dissipate
- `ambient-temperature`: Ambient temperature for convection calculation

## Outputs

- `natural-convection-result`: Temperature rise with natural convection only, whether it meets the thermal budget
- `forced-convection-result`: Temperature rise at specified airflow, whether it meets the thermal budget
- `airflow-requirement`: Minimum airflow in LFM needed to meet the thermal budget, if natural convection is insufficient

## Process

1. For natural convection: h_natural is approximately 5 to 15 W/m^2*K for a horizontal surface (varies with surface temperature and geometry). Use the Rayleigh number correlation: h = (k/L) * C * (Ra)^n where Ra = (g * beta * delta_T * L^3) / (nu * alpha). For typical PCB conditions (delta_T = 40C, L = 50 mm), h is around 8 to 12 W/m^2*K.
2. For forced convection: h_forced is approximately 20 to 100 W/m^2*K depending on airflow velocity. Use the flat plate correlation: h = (k/L) * 0.664 * Re^0.5 * Pr^0.33 for laminar flow (Re < 5e5). For a heat sink with fins, use the vendor's thermal resistance curve (R_sa vs airflow) which already accounts for the fin geometry.
3. Calculate total power dissipation: P_total = (T_j - T_ambient) / R_theta_ja_total. Solve for T_j: T_j = T_ambient + P * (R_jc * R_jb / (R_jc + R_jb)) for the parallel path model. If T_j exceeds T_j_max, either increase airflow, add a larger heat sink, or reduce power dissipation.
4. If natural convection is insufficient, calculate the required airflow: solve for h_forced that gives the needed R_sa, then convert to airflow velocity using the correlation or the heat sink vendor's data. Specify the fan requirement: CFM needed = airflow_velocity * cross_section_area. Add 20% margin for system-level pressure drop.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
