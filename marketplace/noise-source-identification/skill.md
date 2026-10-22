# Noise Source Identification

Identify and rank noise sources using sound intensity mapping, transfer path analysis, and source-path-receiver decomposition.

## Inputs

- `noise-problem-description`: Description of the noise issue including affected locations, subjective complaints, and operating conditions
- `noise-target`: Target noise level or reduction requirement (dB, dBA, octave band, or noise criterion)

## Outputs

- `source-ranking`: Ranked list of noise sources with their contribution to the total noise at the receiver location
- `path-characterization`: Airborne and structure-borne transmission paths identified with their relative contributions
- `dominant-frequencies`: Frequency bands where noise exceeds the target, identifying tonal vs broadband character

## Process

1. Measure overall sound pressure levels at the receiver location under operating conditions. Obtain octave or third-octave band spectrum. Compare to target noise criterion (NC, RC, or dBA limit) to identify which frequency bands need reduction and by how many dB.
2. Use sound intensity mapping (scanning or discrete grid) to identify which surfaces or components radiate the most power. Sound intensity gives net power flow, distinguishing source from reflecting surfaces unlike pressure measurements alone.
3. Discriminate airborne from structure-borne paths. For airborne: measure with path blocked (lead vinyl barrier over suspected surface) to quantify its contribution. For structure-borne: measure vibration on radiating surfaces and compute radiated power from velocity and radiation efficiency.
4. For complex machines, apply transfer path analysis: measure operational source strengths (blocked force or matrix inversion method) and path transfer functions to reconstruct contributions at the receiver. Rank paths by partial sound pressure.
5. Identify tonal components from narrowband FFT analysis. Relate tonal frequencies to source mechanisms (rotation speed, blade pass frequency, gear mesh, electrical hum at mains frequency and harmonics).
6. Summarize the noise budget: list each source-path combination, its contribution in dB at the receiver, and the gap to target. This prioritizes which paths to treat.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
