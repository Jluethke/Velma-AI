# Decoupling Capacitor Selection And Placement

Select decoupling capacitors by analyzing their real impedance curves (including ESR and ESL), identify anti-resonance between capacitor groups, and determine placement strategy relative to the IC power pins.

## Inputs

- `target-impedance`: PDN target impedance in milliohms
- `frequency-range`: Frequency range the PDN must cover
- `available-capacitors`: Capacitor library with values, packages, ESR, and ESL from vendor SPICE models

## Outputs

- `capacitor-bill-of-materials`: Selected capacitors with values, packages, quantities, and their individual impedance contributions by frequency band
- `anti-resonance-analysis`: Identified anti-resonance peaks between capacitor groups, their frequencies, and whether they breach the target impedance
- `placement-priority-map`: Capacitor placement priority: which caps must be closest to the IC pins and why, with maximum loop inductance budget for each

## Process

1. For each candidate capacitor, plot its real impedance curve: Z = sqrt(ESR^2 + (2*pi*f*ESL - 1/(2*pi*f*C))^2). The minimum impedance occurs at the series resonant frequency f_res = 1/(2*pi*sqrt(L*C)) and equals ESR at that point. A 100nF 0402 cap with 0.5nH ESL resonates at about 22 MHz.
2. Build the PDN impedance by paralleling capacitor groups. Start from the VRM (covers DC to about 10 kHz), add bulk electrolytics (10 kHz to 1 MHz), add MLCCs in decreasing values (1 MHz to hundreds of MHz), and rely on plane capacitance above that. Each group hands off to the next.
3. Identify anti-resonance: when a large capacitor becomes inductive (above its SRF) and a smaller capacitor is still capacitive, they form a parallel LC tank that creates an impedance peak. This peak can be 10x to 100x above the individual capacitor impedances. If any anti-resonance peak breaches the target impedance, add intermediate-value capacitors to fill the gap, or increase the quantity of existing values to lower the peak.
4. Assign placement priority: the smallest capacitors (highest SRF) must be closest to the IC power pins because they handle the fastest transients. Calculate the maximum loop inductance budget for each cap: L_max = Z_target / (2*pi*f_max) where f_max is the upper frequency this cap serves. Convert to physical distance: each mm of trace adds roughly 1 nH, each via adds 0.5 to 1 nH.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
