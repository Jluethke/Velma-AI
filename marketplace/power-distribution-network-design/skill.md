# Power Distribution Network Design

Design the power distribution network (PDN) to deliver stable supply voltage to all ICs with impedance below the target from DC to the highest switching frequency.

## Inputs

- `power-requirements`: Supply voltage, steady-state current, peak transient current, allowed voltage ripple (typically 3 to 5 percent of Vdd)
- `ic-decoupling-model`: On-die capacitance, package inductance, number and inductance of power/ground vias

## Outputs

- `target-impedance-profile`: The maximum allowed PDN impedance vs frequency: Ztarget = delta_V / delta_I, typically flat from DC to the processor's clock frequency
- `decoupling-strategy`: Number and value of bulk capacitors, MLCC capacitors (by size: 0402, 0201), and their placement, plus the plane capacitance contribution

## Process

1. Calculate target impedance: Ztarget = allowed_ripple_voltage / max_transient_current. For a 1.0V supply with 3 percent ripple tolerance and 10A transient current: Ztarget = 0.03V / 10A = 3 milliohm. This impedance must be maintained from DC to the highest frequency component of the transient (typically the clock frequency or faster).
2. The PDN impedance has four regions. At DC, the VRM output impedance dominates (milliohms). From 1 kHz to 100 kHz, bulk capacitors (electrolytic, polymer) provide low impedance. From 100 kHz to 100 MHz, MLCC decoupling capacitors maintain impedance. Above 100 MHz, the power/ground plane capacitance and on-die decoupling take over.
3. Size bulk capacitors: select enough capacitance so that the impedance stays below Ztarget at the VRM bandwidth frequency (typically 10 to 50 kHz). A 100uF polymer capacitor with 5 mohm ESR has impedance crossing Ztarget at f = ESR*C crossover. Use multiple in parallel to reduce the effective ESR.
4. Size MLCC decoupling: each MLCC has a series resonant frequency where its impedance is minimum (equal to ESR, typically 2 to 10 mohm). A 100nF 0402 MLCC resonates near 100 MHz, a 10nF near 300 MHz, a 1nF near 1 GHz. Use a mix of values to cover the frequency range from 1 MHz to 1 GHz. Place them as close as possible to the IC power pins to minimize the loop inductance.
5. Calculate plane capacitance: Cplane = Er*E0*A/d where A is the plane overlap area and d is the dielectric thickness. For a 4-inch x 4-inch plane pair with 4-mil FR-4 spacing: Cplane = 4.3*8.85e-12*(0.1)^2/(0.1e-3) = 380 pF. This is small but has very low inductance, so it is effective above 500 MHz where MLCCs become inductive.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
