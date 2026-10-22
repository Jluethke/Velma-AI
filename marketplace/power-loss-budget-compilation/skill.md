# Power Loss Budget Compilation

Compile the total power dissipation budget for the system by calculating losses in every component: switches, diodes, magnetics, capacitors, and resistive elements.

## Inputs

- `converter-design`: Complete converter schematic with all component values, switching frequency, and operating voltages and currents
- `operating-conditions`: Ambient temperature range (min/max), airflow conditions (natural convection, forced air with velocity), and altitude if applicable

## Outputs

- `loss-breakdown`: Itemized power loss for each component: MOSFET conduction and switching loss, diode conduction and recovery loss, inductor core and copper loss, capacitor ESR loss, gate driver loss, control IC quiescent loss
- `total-dissipation`: Total system power dissipation in watts at worst-case operating point (typically max load, max ambient, min input voltage for buck), and efficiency calculation

## Process

1. Calculate MOSFET losses. Conduction: Pcond = Irms^2 * Rds(on) at max junction temp (Rds(on) increases ~0.4%/C above 25C, roughly doubles at 150C). Switching: Psw = 0.5 * Vds * Id * (tr + tf) * fsw, where tr and tf include MOSFET transition times plus driver delay. Third quadrant (body diode): Pbd = Vf * I * t_dead * 2 * fsw.
2. Calculate diode losses (if discrete). Conduction: Pcond = Vf * Iavg + Rd * Irms^2 (use the linear model from the V-I curve at operating temperature). Reverse recovery: Prr = 0.5 * Qrr * Vr * fsw. Schottky diodes: no recovery loss but higher leakage at high temperature (check Ir at 150C).
3. Calculate magnetic losses from the magnetics design: Pcore + Pcopper as previously determined. These are often the second largest loss after switches.
4. Calculate capacitor losses: PESR = Irms_ripple^2 * ESR for each capacitor. For electrolytic caps, ESR is frequency-dependent and temperature-dependent (lower ESR at higher temp). For ceramic caps, ESR is very low but AC heating from dielectric loss (tan_delta) can matter at high ripple.
5. Sum all losses. The total should match the expected efficiency: eta = Pout / (Pout + Ploss_total). If efficiency is lower than target, identify the dominant loss mechanism and address it (lower Rds(on) switch, higher frequency with lower magnetics loss, etc.).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
