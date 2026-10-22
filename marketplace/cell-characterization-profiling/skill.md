# Cell Characterization Profiling

Characterize the battery cell's electrical and thermal properties to build the models needed for accurate SOC and SOH estimation.

## Inputs

- `cell-datasheet`: Cell chemistry (NMC, LFP, NCA), nominal capacity, voltage range (Vmin to Vmax), maximum continuous and pulse discharge rates, cycle life rating
- `test-equipment`: Available test capabilities: constant current/voltage source, temperature chamber, impedance analyzer

## Outputs

- `ocv-soc-curve`: Open-circuit voltage vs state of charge table at multiple temperatures (0C, 25C, 45C), measured at C/20 or slower to approximate thermodynamic equilibrium
- `impedance-model`: Equivalent circuit model parameters: ohmic resistance R0, charge-transfer resistance R1 with time constant tau1 = R1*C1, and optionally a second RC pair, at multiple SOC points and temperatures

## Process

1. Measure the OCV-SOC curve by discharging from 100 percent to 0 percent SOC at C/20 (or lower) rate, recording voltage every 0.1 percent SOC. Repeat at charge direction. The average of charge and discharge curves minimizes hysteresis error. The OCV-SOC curve is the foundation of coulomb-counting-corrected SOC estimation.
2. For LFP chemistry, the OCV-SOC curve has a flat plateau from 20 to 80 percent SOC (voltage changes less than 50mV over 60 percent of capacity), making OCV-based SOC estimation poor in the plateau region. For NMC and NCA, the curve is more monotonic and OCV-based correction works across the full range.
3. Measure impedance using EIS (electrochemical impedance spectroscopy) from 10 kHz to 10 mHz at 10, 30, 50, 70, and 90 percent SOC, and at 0C, 25C, and 45C. Fit the Nyquist plot to an equivalent circuit: R0 (high-frequency intercept) in series with one or two R-C parallel networks (the semicircle). R0 increases 3 to 5x from 25C to 0C due to electrolyte conductivity drop.
4. Alternatively, if EIS equipment is unavailable, use pulse testing: apply a current pulse (1C for 10 seconds, then rest for 1 hour) at each SOC point. R0 = immediate voltage drop / I_pulse. R1 and C1 are extracted from the exponential voltage recovery during the rest period: V(t) = V_final - R1*I*exp(-t/tau1).
5. Measure capacity vs temperature and C-rate. The usable capacity decreases at low temperatures (typically 70 to 80 percent of nominal at 0C) and at high C-rates (internal resistance drop reduces the voltage to cutoff sooner). This data is needed for accurate remaining-capacity estimation in the BMS.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
