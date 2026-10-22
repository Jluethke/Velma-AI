# Conducted Emission Filter Design

Design filters for conducted emissions on power lines and I/O cables, using LISN measurement data to determine filter requirements.

## Inputs

- `dominant-mechanisms`: Ranked emission sources
- `frequency-bands`: Regulatory limits and frequency ranges
- `cable-interfaces`: Cables requiring filtering

## Outputs

- `filter-topologies`: Pi, T, or L filter topology for each interface with component values and their rationale
- `common-mode-choke-specs`: Common-mode choke specifications: impedance at frequency, DC resistance, saturation current
- `filter-insertion-loss`: Calculated and simulated insertion loss vs frequency for each filter, compared to the required attenuation

## Process

1. Determine the required filter attenuation: measure or estimate conducted emissions at the LISN without filtering. Compare to the regulatory limit (e.g., CISPR 32 Class B). The difference plus 6 dB margin is the required filter insertion loss at each frequency.
2. Choose the filter topology based on source and load impedance. Noise from a switching regulator (low source impedance) into a LISN (50 ohm) needs a high-impedance-first filter: inductor (or ferrite bead) facing the source, capacitor facing the LISN. The LC combination gives -40 dB/decade rolloff above the cutoff frequency.
3. For common-mode conducted emissions (which become radiated emissions from the cable): use a common-mode choke. The choke presents high impedance to common-mode current while passing differential-mode current. Select the choke by its impedance at the problem frequency (not by inductance alone, because the choke's impedance is resistive above its SRF, which is often desirable for broadband attenuation).
4. Simulate the complete filter including parasitic elements: capacitor ESL limits high-frequency performance, inductor inter-winding capacitance creates a parallel resonance. A filter that looks good in ideal simulation may have a null in insertion loss at the parasitic resonance frequency. Use the vendor's SPICE models that include parasitics.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
