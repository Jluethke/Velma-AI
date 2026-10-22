# Rcd Clamp For Flyback

Design an RCD clamp circuit for flyback converter primary to absorb transformer leakage inductance energy and limit the MOSFET drain voltage to a safe level.

## Inputs

- `snubber-component-values`: RC snubber analysis for comparison
- `snubber-power-dissipation`: Snubber loss budget

## Outputs

- `rcd-clamp-design`: Clamp capacitor, resistor, and diode values. Clamp voltage selection as a trade-off between MOSFET voltage stress and clamp power dissipation
- `clamp-waveform-analysis`: Expected drain voltage waveform showing the clamping action: Vds rises to Vin + N*Vout, overshoots to Vclamp, then decays as the clamp capacitor discharges through the resistor

## Process

1. Select the clamp voltage. The MOSFET sees: Vds_max = Vin_max + Vclamp. The reflected output voltage is Vreflected = N * Vout where N is the turns ratio. Set Vclamp = Vreflected * (1 + k) where k = 0.3 to 1.0. Lower k means less clamping dissipation but higher MOSFET voltage stress. With 650V MOSFET: Vclamp_max = 650 * 0.8 - Vin_max (using 80% derating).
2. Calculate the clamp resistor. The leakage energy per cycle E = 0.5 * Lleak * Ipk^2 is absorbed by the clamp. In steady state, this energy is dissipated in the resistor: Pclamp = E * fsw = 0.5 * Lleak * Ipk^2 * fsw. The resistor value: Rclamp = Vclamp^2 / Pclamp (since the cap charges to Vclamp and the resistor dissipates the energy).
3. Calculate the clamp capacitor. The capacitor must hold the clamp voltage approximately constant during the energy absorption (low ripple). Voltage ripple: delta_V = Ipk * Lleak / (Cclamp * Vclamp). For less than 5% ripple: Cclamp > 20 * Ipk * Lleak / (Vclamp * delta_V). Typical values: 1nF to 100nF depending on power level.
4. Select the clamp diode. It must block Vin + Vclamp in the off state. It must be fast enough (trr < 50ns) to conduct the leakage current spike without allowing excessive voltage overshoot. Ultra-fast recovery or SiC Schottky diodes are preferred. Forward voltage drop adds to the clamp voltage: account for Vf in the clamp voltage calculation.
5. Optimize the clamp voltage. Plot: MOSFET voltage stress vs clamp voltage, clamp power dissipation vs clamp voltage, and total system efficiency vs clamp voltage. The optimum is where reducing Vclamp further causes diminishing efficiency gain but rapidly increases MOSFET voltage stress. For most flyback designs, Vclamp = 1.3 to 1.5 times the reflected voltage is a good starting point.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
