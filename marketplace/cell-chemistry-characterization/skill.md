# Cell Chemistry Characterization

Characterize the selected cell chemistry to establish voltage curves, impedance model, capacity, and thermal behavior that drive all BMS design decisions.

## Inputs

- `cell-selection`: Selected cell: chemistry (LFP, NMC, NCA, LTO), form factor (cylindrical, pouch, prismatic), capacity (Ah), and nominal voltage
- `application-requirements`: Pack voltage, energy (kWh), peak current, operating temperature range, and cycle life target

## Outputs

- `cell-model`: Equivalent circuit model: OCV(SOC) lookup table, series resistance Rs, RC pairs for transient response (R1/C1 for fast dynamics, R2/C2 for slow diffusion), all as functions of SOC and temperature
- `operating-limits`: Cell operating limits: max/min voltage per chemistry (4.2V/2.5V for NMC, 3.65V/2.0V for LFP), max continuous and peak discharge current, max charge current vs temperature (CCCP curve), temperature limits

## Process

1. Characterize the OCV-SOC relationship. Fully charge the cell, rest for 2+ hours (to reach equilibrium), then discharge in 5% SOC increments with 1-hour rest periods between each step. Record the rested voltage at each SOC point. Repeat at 0C, 25C, and 45C. The resulting OCV(SOC, T) table is the foundation of SOC estimation.
2. Measure the impedance model. Apply pulse discharge tests: 10-second current pulses at C/5, 1C, and 3C rates at each SOC point. From the voltage response: the immediate voltage drop gives Rs (series resistance). The exponential recovery gives R1/C1 (fast dynamics, tau = 1-10s) and R2/C2 (slow diffusion, tau = 100-1000s).
3. Document the capacity vs temperature: at 0C, capacity may be 70-80% of the 25C rating. At -20C, as low as 50%. The charge acceptance also drops dramatically at low temperature (lithium plating risk). Record the maximum charge rate vs temperature: at 0C, most cells limit to 0.1C-0.2C charge rate.
4. Characterize the cycle life degradation. The capacity fade model: C(n) = C(0) * (1 - k * n^0.5) where n is the cycle count and k is an empirical constant depending on depth of discharge, charge rate, and temperature. LFP at 80% DOD: 3000+ cycles to 80% capacity. NMC at 80% DOD: 1000-2000 cycles. High temperature accelerates degradation (roughly doubles for each 10C increase).
5. Compile the complete cell model: OCV table, impedance parameters, capacity vs temperature, charge rate limits vs temperature, and cycle life curves. This is the input to the BMS algorithm design.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
