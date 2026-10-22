# Emi Filter Thermal Design

Design the input EMI filter to meet conducted emissions standards, then verify the full converter thermal performance under worst-case conditions.

## Inputs

- `power-spec`: Input voltage range, switching frequency, input current waveform
- `loss-breakdown`: Loss in each component: MOSFET, diode, inductor, capacitor ESR
- `constraints`: EMI standard to meet (CISPR 32 Class B, FCC Part 15B), ambient temperature, cooling method (natural convection, forced air, heatsink)

## Outputs

- `emi-filter-design`: Component values for the EMI filter: common-mode choke inductance and capacitance (Y-caps), differential-mode inductance and capacitance (X-caps), damping if needed
- `thermal-analysis`: Junction temperature of each semiconductor, hot-spot temperature of magnetics, and thermal margin to maximum rated temperature

## Process

1. Measure or estimate the conducted emissions spectrum. The fundamental is at fsw with harmonics at N*fsw. The envelope of a trapezoidal current waveform falls at -20 dB/decade up to 1/(pi*trise) and then -40 dB/decade. If trise = 50ns, the first breakpoint is at about 6 MHz.
2. Separate common-mode (CM) and differential-mode (DM) noise. DM noise is driven by the pulsed input current of the converter. CM noise is driven by dV/dt across the switching node coupling through parasitic capacitance to ground (heatsink, chassis). At low frequencies (below 1 MHz), DM usually dominates. Above 5 MHz, CM often dominates.
3. DM filter: a pi-filter with Cx capacitors and a DM inductor (or use the leakage inductance of the CM choke). The required attenuation at fsw is: A_required = V_noise(fsw) - V_limit(fsw) + 6dB margin. A single-stage LC filter gives -40 dB/decade above resonance. The filter corner frequency must be low enough to provide the required attenuation at fsw.
4. CM filter: a CM choke (high impedance to CM current, transparent to DM current) plus Y-capacitors to ground. Y-cap values are limited by safety leakage current requirements: for IEC 60950 Class I, total Y-cap leakage must be under 3.5 mA at line frequency. This limits each Y-cap to about 4.7nF for 240VAC/50Hz applications.
5. Thermal: total power dissipation Ptotal = Pcond_FET + Psw_FET + Pdiode + Pcore + Pcopper + PESR_cap. Junction temperature Tj = Ta + Ptotal * Rth_ja where Rth_ja is the junction-to-ambient thermal resistance. For a MOSFET on a PCB with no heatsink, Rth_ja is typically 40 to 80 C/W. For a MOSFET on a heatsink, Rth_ja = Rth_jc + Rth_cs + Rth_sa. The maximum Tj must stay below the rated limit (typically 125C or 150C) with margin for ambient temperature variation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
