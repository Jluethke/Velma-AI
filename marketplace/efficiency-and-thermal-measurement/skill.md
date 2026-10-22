# Efficiency And Thermal Measurement

Measure power supply conversion efficiency across the load range and correlate with component thermal performance to identify loss-dominant components.

## Inputs

- `supply-specification`: Efficiency specification and thermal limits
- `ripple-noise-data`: Ripple and switching frequency data for loss correlation

## Outputs

- `efficiency-curve`: Efficiency vs load current at each input voltage, with power loss breakdown at key operating points
- `thermal-map`: Component temperatures at each load point from thermal camera or thermocouple measurements, identifying the hottest components
- `loss-analysis`: Estimated loss breakdown: conduction loss, switching loss, magnetic core loss, copper loss, quiescent current, gate drive loss

## Process

1. Measure input power and output power simultaneously using a power analyzer or calibrated DMMs. For accuracy, use a shunt resistor with 4-wire Kelvin connection for current measurement, or a power analyzer with at least 0.1% basic accuracy.
2. Calculate efficiency at each load point: eta = P_out / P_in * 100%. Plot efficiency vs load current. Identify the peak efficiency point (typically 50-70% load for most switching converters) and the light-load efficiency (often poor due to fixed quiescent and switching losses).
3. Measure component temperatures using a thermal camera (correct emissivity for each material: PCB laminate ~0.90, IC package ~0.85, exposed copper ~0.05 to 0.10) or thermocouples attached with thermal adhesive. Record temperatures at 25%, 50%, 75%, and 100% load after thermal equilibrium.
4. Identify the loss-dominant components. The MOSFET dissipates conduction loss (I_rms^2 * Rds_on) and switching loss (0.5 * V_in * I_out * (t_rise + t_fall) * f_sw). The inductor dissipates core loss (from Steinmetz equation) and copper loss (I_rms^2 * DCR plus AC winding loss from proximity effect).
5. Correlate thermal data with calculated losses. If a component runs hotter than the loss calculation predicts, investigate thermal path issues (poor solder connection, inadequate copper area, missing thermal pad connection). If calculated total loss does not match measured input-output difference, look for unmeasured loss paths (snubber dissipation, gate drive loss, control IC quiescent current).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
