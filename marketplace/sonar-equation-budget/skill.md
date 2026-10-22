# Sonar Equation Budget

Apply the sonar equation to size the sonar system for the required detection range against the expected target in the expected environment.

## Inputs

- `detection-requirements`: Target type, detection range, classification requirements, operating area
- `platform-constraints`: Ship/submarine/UUV size, power, speed, self-noise

## Outputs

- `sonar-performance-budget`: Complete sonar equation budget showing source level, transmission loss, target strength, noise level, array gain, and detection threshold
- `operating-frequency`: Selected frequency with justification from the range-resolution-absorption trade-off

## Process

1. Write the active sonar equation in dB: SE = SL - 2*TL + TS - (NL - AG) - DT where SE is signal excess (positive means detection), SL is source level, TL is one-way transmission loss, TS is target strength, NL is noise level, AG is array gain, and DT is detection threshold.
2. Select the operating frequency from the range-resolution-absorption trade-off. Low frequency (1-10 kHz): long range (tens of km), low absorption (< 1 dB/km at 1 kHz), poor resolution, large transducers. Medium (10-100 kHz): moderate range (1-10 km), moderate absorption, good resolution, used for mine hunting and fish finding. High (100 kHz - 1 MHz): short range (<1 km), high absorption, fine resolution for imaging and profiling.
3. Estimate transmission loss. Spherical spreading: TL = 20*log10(R) applies in deep water. Cylindrical spreading: TL = 10*log10(R) + alpha*R in shallow water with surface/bottom bounding. Absorption coefficient alpha (dB/km) from Francois-Garrison model: strong function of frequency (0.06 at 1 kHz, 10 at 100 kHz, 36 at 300 kHz in seawater). For ducted propagation, use a propagation model (ray tracing or normal mode) with the local sound speed profile.
4. Estimate target strength. Submarines: 15-25 dB at beam aspect, 5-10 dB at bow/stern. Fish (individual): -45 to -35 dB depending on species and frequency. Mine: -10 to 0 dB. Ship hull: 10-20 dB. TS varies with frequency and aspect angle.
5. Estimate noise level. Ambient noise: Wenz curves give the noise spectral level vs frequency (shipping, wind, rain, biological). Self-noise: flow noise from platform motion, machinery noise. Use the higher of ambient and self-noise. Typical deep ocean: 60-70 dB re 1 uPa in the 1-10 kHz band.
6. Close the equation. Set DT from the required probability of detection and false alarm rate (DT ~ 10-15 dB for Pd = 0.5, Pfa = 1e-4 in Gaussian noise). Compute the required SL - AG combination to achieve positive signal excess at the required range. AG = 10*log10(N) for a uniformly weighted line array of N elements.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
