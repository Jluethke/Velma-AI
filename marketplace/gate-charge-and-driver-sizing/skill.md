# Gate Charge And Driver Sizing

Analyze gate charge requirements from the MOSFET/IGBT datasheet and size the gate driver current capability for target switching speed.

## Inputs

- `switch-datasheet`: MOSFET or IGBT datasheet with Qg (total gate charge), Qgs (gate-source charge), Qgd (gate-drain Miller charge), Vgs(th), and gate charge curve
- `switching-speed-target`: Target turn-on and turn-off times in nanoseconds, or maximum dv/dt and di/dt if constrained by EMI

## Outputs

- `driver-current-requirement`: Peak source and sink current in amps: Ig = Qg / t_sw for total, or Ig_miller = Qgd / t_miller for the critical Miller plateau phase
- `gate-resistor-value`: External gate resistor value to achieve target switching speed: Rg = (Vdr - Vplateau) / Ig_desired for turn-on, accounting for driver output impedance

## Process

1. Read the gate charge curve from the datasheet. Identify three regions: Qgs (gate voltage rises from 0 to threshold, no drain current flows), Qgd (Miller plateau where Vgs is flat and Vds falls, this determines dv/dt), and the final charge from plateau to Vgs_drive (current redistribution complete).
2. Calculate minimum driver current for target switching time. For the Miller plateau: Ig = Qgd / t_dv. The dv/dt during Miller plateau is approximately Vds / t_dv. For a 400V bus with 50ns dv/dt target: Ig = Qgd / 50ns. If Qgd = 20nC, then Ig = 400mA peak.
3. Size the gate resistor. During turn-on Miller plateau: Rg_on = (Vdriver - Vplateau) / Ig_on. Typically Vdriver = 10-12V for MOSFETs, Vplateau = 4-5V. For 400mA drive: Rg_on = 6V / 0.4A = 15 ohms. Include driver output impedance (typically 1-5 ohms).
4. Calculate gate driver power dissipation: Pgate = Qg * Vdriver * fsw. For Qg = 50nC, Vdriver = 12V, fsw = 100kHz: Pgate = 60mW. This is dissipated in the gate resistor and driver, split roughly equally between turn-on and turn-off paths.
5. For separate turn-on and turn-off resistors (Rg_on and Rg_off with diode steering): use a smaller Rg_on for faster turn-on (lower switching loss) and a smaller Rg_off for faster turn-off, but different from each other to independently optimize di/dt and dv/dt.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
