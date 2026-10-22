# Pv Module And System Design

Size the PV array, select the inverter, design the string configuration, and compute the expected energy yield.

## Inputs

- `cell-technology-selection`: Module efficiency, temperature coefficient, rated power, dimensions
- `cell-electrical-model`: Single-diode parameters for modeling under varying irradiance and temperature

## Outputs

- `system-design`: Number of modules, string configuration (modules in series per string, strings in parallel), inverter model and count, DC/AC ratio, mounting structure (fixed tilt, single-axis tracker, dual-axis tracker)
- `energy-yield-prediction`: Annual energy production (kWh/kWp), performance ratio, specific yield, monthly production profile, losses breakdown (temperature, soiling, shading, wiring, inverter, clipping)

## Process

1. String sizing: the number of modules in series is set by the inverter MPPT voltage window. At the coldest expected temperature: V_oc_max_string = N_series * V_oc_STC * (1 + (T_min - 25) * beta_Voc/100) must not exceed the inverter maximum input voltage. At the hottest temperature: V_mp_min_string = N_series * V_mp_STC * (1 + (T_max - 25) * beta_Vmp/100) must stay within the MPPT range.
2. DC/AC ratio (inverter loading ratio): typically 1.1 to 1.4. Higher ratios increase energy harvest in low-irradiance conditions but clip power during peak irradiance. Optimal ratio depends on the cost of additional modules vs the value of additional energy. For high-irradiance sites with time-of-use pricing that values afternoon energy: lower ratio. For cloudy sites: higher ratio.
3. Energy yield simulation: for each hour of the TMY (typical meteorological year) data, compute: (1) plane-of-array irradiance from GHI, DHI, DNI using the Perez transposition model, (2) cell temperature from irradiance and ambient temperature: T_cell = T_amb + (NOCT - 20) * G/800, (3) module power from the single-diode model at (G, T_cell), (4) DC power after mismatch, soiling, and wiring losses, (5) AC power after inverter efficiency curve.
4. Loss budget: temperature loss 3-10% (depending on climate), soiling 2-5%, mismatch 1-2%, DC wiring 1-2%, inverter loss 2-4%, transformer loss 0.5-1% (for central inverters), clipping 0-3% (depends on DC/AC ratio), shading 0-5% (site-specific).
5. For tracking systems: single-axis tracker (horizontal N-S axis, tracking E-W) increases annual yield by 15-25% over fixed-tilt in high-DNI locations. The tracking algorithm for backtracking near sunrise/sunset prevents row-to-row shading at the cost of some energy loss. Dual-axis tracking adds another 5-10% but at much higher cost and maintenance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
