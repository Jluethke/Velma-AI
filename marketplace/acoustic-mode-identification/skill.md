# Acoustic Mode Identification

Calculate the acoustic resonant frequencies of the combustion chamber and identify which modes are most likely to couple with the combustion process.

## Inputs

- `chamber-geometry`: Chamber diameter, length, nozzle contraction ratio
- `combustion-gas-properties`: Speed of sound, temperature, and composition of combustion products

## Outputs

- `acoustic-mode-map`: Frequencies of longitudinal, tangential, and radial modes
- `mode-coupling-risk`: Assessment of which modes can couple with combustion (based on energy and characteristic time)
- `sensitive-frequency-bands`: Frequency ranges where instability is most likely

## Process

1. Calculate acoustic mode frequencies for a cylindrical chamber: transverse modes f_mn = (alpha_mn * c) / (pi * D), where alpha_mn are Bessel function zeros. First tangential (1T) mode is usually the most dangerous because its pressure antinode is at the injector face where combustion occurs.
2. Longitudinal modes: f_n = n * c / (2 * L_eff), where L_eff is the effective acoustic length of the chamber (accounting for nozzle end correction). Longitudinal modes couple with feed system acoustics and can drive chugging.
3. The coupling mechanism: pressure oscillations modulate propellant injection rate and atomization quality, which modulates heat release rate, which drives pressure oscillations. The Rayleigh criterion states that instability grows when heat release is in phase with pressure oscillation.
4. Characteristic time analysis (Crocco): compare the combustion time delay (atomization + vaporization + mixing + reaction) to the acoustic period. If the time delay is near tau = 1/(2f) for a mode, that mode is at risk. Shorter droplets (finer atomization) have shorter time delays.
5. High-frequency instability (>500 Hz, typically 1-10 kHz) is the most destructive. It can melt chamber walls in milliseconds due to the enhanced heat transfer from oscillating gas. The F-1 engine development required over 2,000 bomb tests to solve tangential instability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
