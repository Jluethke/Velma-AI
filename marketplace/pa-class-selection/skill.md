# Pa Class Selection

Select the PA operating class based on the required linearity, efficiency, bandwidth, and output power, considering the signal characteristics (peak-to-average ratio).

## Inputs

- `pa-requirements`: Output power, frequency, bandwidth, efficiency target, linearity requirement (EVM, ACPR, or spectral mask), and signal type (CW, pulsed, modulated with PAPR)
- `technology-options`: Available transistor technologies: GaAs PHEMT, GaN HEMT, LDMOS, SiGe HBT, and their power/frequency capabilities

## Outputs

- `pa-class-selection`: Selected PA class (A, AB, B, C, D, E, F, or Doherty/ET architecture) with justification from the requirements
- `transistor-selection`: Selected transistor technology and specific device with rated power, gain, efficiency at the operating frequency, and thermal resistance

## Process

1. Class A: transistor conducts for the full cycle. Maximum theoretical efficiency 50% (25% with reactive load). Best linearity. Use when linearity is paramount and efficiency is secondary. Typical for small-signal driver stages.
2. Class AB: conduction angle between 180 and 360 degrees. Efficiency 50 to 70% depending on bias. Good linearity with back-off. Most common class for linear PAs in communication systems. Bias the transistor at 10 to 20% of Idss for a good linearity/efficiency compromise.
3. Class B: conduction angle exactly 180 degrees. Maximum theoretical efficiency 78.5%. Produces crossover distortion at low signal levels. Rarely used alone; push-pull class B eliminates even harmonics.
4. Class C: conduction angle less than 180 degrees. Efficiency up to 85%. Non-linear, suitable only for constant-envelope signals (FM, GMSK) or as a peaking amplifier in Doherty.
5. Class E: switch-mode. The transistor operates as a switch. Efficiency theoretically 100% but requires careful harmonic termination. Works well for narrow-band applications at frequencies where the transistor can approximate an ideal switch. Practical efficiency 80 to 90%.
6. Class F: the transistor output is terminated in specific harmonic impedances (short at even harmonics, open at odd harmonics, or the inverse for class F-1) to shape the voltage and current waveforms for high efficiency. Requires precise harmonic matching.
7. Doherty: uses a main amplifier (class AB) and a peaking amplifier (class C) combined through a quarter-wave impedance inverter. Provides high efficiency at both peak power and at 6 to 10 dB back-off, which is critical for signals with high PAPR like OFDM.
8. Select the transistor: GaN HEMT for high power density and wide bandwidth (DC to 40+ GHz). LDMOS for high power at lower frequencies (< 4 GHz, base stations). GaAs PHEMT for moderate power at higher frequencies (5 to 40 GHz). Choose a device rated for 2 to 3x the required linear output power.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
