# Radiation Mechanism Identification

Identify whether emissions are common mode or differential mode, locate the radiating structure, and determine the dominant mechanism before attempting fixes.

## Inputs

- `circuit-description`: Schematic and layout with clock frequencies, switching regulators, and I/O interfaces identified
- `frequency-bands`: Regulatory frequency bands of concern (e.g., FCC Part 15B, CISPR 32)
- `cable-interfaces`: All cables attached to the product with their type, length, and shielding

## Outputs

- `emission-source-map`: Map of potential emission sources: clock harmonics, switching regulator harmonics, digital bus transitions, with their fundamental frequencies and significant harmonics
- `radiation-mode-assessment`: For each source: whether it radiates as differential mode (the signal loop is the antenna) or common mode (the cable or chassis is the antenna), with the reasoning
- `dominant-mechanisms`: Ranked list of the top 3 to 5 most likely emission problems, based on frequency, amplitude, and antenna efficiency

## Process

1. List every periodic signal source: crystal oscillators, PLLs, switching regulators (and their harmonics to the 10th or higher), digital buses (clock and data harmonics). Calculate harmonic amplitudes: a trapezoidal waveform with rise time t_r has harmonic amplitudes that roll off at -20 dB/decade above f1 = 1/(pi*t_r) and -40 dB/decade above f2 = 1/(pi*t_r) (where t_r is 10-90% rise time).
2. Determine the radiation mode for each source. Differential mode: the signal and its return form a small loop that radiates. Radiated power scales as (loop area)^2 * f^4. Common mode: a voltage difference drives current onto a cable or structure that acts as a monopole antenna. Common mode dominates above a few hundred MHz in most products because cable lengths are efficient antennas at those frequencies.
3. Estimate antenna efficiency for each radiating structure. A cable becomes an efficient quarter-wave antenna at f = c / (4 * L_cable). A 1-meter cable resonates at 75 MHz. A 15 cm trace resonates at 500 MHz. At resonance, even microamps of common-mode current produce fields that exceed regulatory limits.
4. Rank the mechanisms: the combination of source amplitude at that frequency multiplied by antenna efficiency at that frequency gives the relative emission severity. Focus design effort on the top-ranked mechanisms first.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
