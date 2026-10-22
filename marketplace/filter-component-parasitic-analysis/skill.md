# Filter Component Parasitic Analysis

Analyze how real component parasitics (ESR, ESL, interwinding capacitance, core loss) degrade filter performance at high frequency, and mitigate these effects.

## Inputs

- `cm-filter-topology`: CM filter design with component values
- `cm-choke-specification`: CM choke selection and characteristics

## Outputs

- `parasitic-model`: Complete parasitic model of each filter component showing ESR, ESL, interwinding capacitance, and frequency where each parasitic dominates
- `high-frequency-mitigation`: Measures to maintain filter effectiveness above 10MHz: ferrite beads, feed-through capacitors, shielded inductors, PCB layout rules

## Process

1. Model each capacitor as the series RLC: ideal C in series with ESR and ESL. The impedance minimum is at SRF. Above SRF, the capacitor is inductive. For a 1uF film cap with 10nH ESL: SRF = 1.6MHz. Above this, the capacitor impedance rises at +20dB/decade, providing no filtering.
2. Model the CM choke. Below resonance: impedance rises with frequency (inductive). At resonance (typically 1-5MHz): impedance peaks, determined by the loss tangent of the core. Above resonance: interwinding capacitance (5-50pF typical) provides a bypass path that shorts out the inductance. The choke becomes a capacitor and CM noise passes through.
3. Quantify the impact. Plot the ideal filter attenuation (based on nominal L and C values) versus the real attenuation (including parasitics). The real curve always hits a floor at high frequency where parasitics dominate. This floor must be below the emission limit.
4. Mitigation: add a small ceramic capacitor (100pF-1nF, C0G/NP0 for stable capacitance) in parallel with each film cap for high-frequency bypass. Add a ferrite bead in series with each line at the entry point for attenuation above 10MHz. Use feed-through capacitors at the chassis boundary for maximum high-frequency performance.
5. Layout rules: minimize the loop area between filter input and output. Keep CM choke away from switching node traces. Route the ground return for Y-caps directly to the chassis ground terminal. Maintain separation between filtered (clean) and unfiltered (noisy) sides of the PCB. Never route noisy traces under or near the CM choke.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
