# Mosfet Loss Calculation

Calculate conduction and switching losses for candidate MOSFETs at the converter operating point, accounting for temperature effects and gate drive conditions.

## Inputs

- `converter-requirements`: Drain-source voltage, RMS and peak current, switching frequency, gate drive voltage, and operating ambient temperature
- `candidate-datasheets`: Datasheets for 3-5 candidate MOSFETs with Rds(on), Qg, Qgd, Coss, turn-on/turn-off times, and thermal resistance

## Outputs

- `conduction-loss-comparison`: Pcond = Irms^2 * Rds(on) at operating junction temperature for each candidate, noting the Rds(on) temperature coefficient
- `switching-loss-comparison`: Psw for each candidate: turn-on loss (including diode reverse recovery), turn-off loss, and Coss-related loss at the operating voltage and current

## Process

1. Calculate Rds(on) at operating temperature. The datasheet specifies Rds(on) at 25C. The temperature coefficient is positive: Rds(on)(T) = Rds(on)(25) * (T/300)^2.3 approximately. At 100C, Rds(on) is roughly 1.7x the 25C value. Use the operating Tj, not ambient, for this calculation.
2. Calculate conduction loss: Pcond = Irms^2 * Rds(on)(Tj). For a buck converter, Irms = Iout * sqrt(D). For the freewheeling MOSFET (synchronous rectifier), Irms = Iout * sqrt(1-D). Include body diode conduction during dead time if applicable.
3. Estimate switching loss from datasheet waveforms. Turn-on: the MOSFET charges through the Miller plateau while simultaneously carrying the inductor current and supporting the bus voltage. Energy per turn-on event: Eon = 0.5 * Vds * Id * (tri + tfv) where tri is the current rise time and tfv is the voltage fall time. These depend on gate drive strength: tri = Qgs2 / Ig, tfv = Qgd / Ig.
4. Turn-off: reverse of turn-on. Eoff = 0.5 * Vds * Id * (trv + tfi). Additionally, the Coss must be charged from near zero to Vds: Ecoss = integral(Vds * Coss(Vds) dVds) from 0 to Vds. This energy is dissipated in the switch at the next turn-on (hard switching) or recovered (soft switching).
5. Include reverse recovery of the complementary diode. When the high-side MOSFET turns on in a synchronous buck, the low-side body diode reverse recovery adds to the turn-on loss: Prr = Qrr * Vds * fsw. Si MOSFETs: Qrr can be significant (50-200nC). GaN: no reverse recovery (no p-n body diode).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
