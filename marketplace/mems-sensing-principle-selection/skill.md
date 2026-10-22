# Mems Sensing Principle Selection

Select the transduction mechanism and mechanical structure from the measurand requirements.

## Inputs

- `measurand-spec`: Physical quantity, range, bandwidth, and resolution requirement
- `performance-targets`: Noise floor, linearity, cross-axis rejection, and drift targets
- `size-cost-constraints`: Die size, package size, power budget, and target cost at volume

## Outputs

- `transduction-mechanism`: Capacitive, piezoresistive, piezoelectric, or resonant with justification
- `mechanical-structure-concept`: Spring-mass, diaphragm, tuning fork, or Coriolis structure with key dimensions
- `performance-estimate`: Estimated sensitivity, noise floor, and bandwidth from first-order analysis

## Process

1. Map the measurand to standard MEMS structures. Acceleration: spring-mass system (proof mass suspended by folded beams). Angular rate (gyroscope): vibrating proof mass with Coriolis sensing (drive mode + sense mode). Pressure: thin diaphragm deflecting under pressure difference. Microphone: diaphragm + backplate forming a variable capacitor. Resonant sensors: frequency shift of a vibrating beam under stress (highest resolution but narrowest bandwidth).
2. Select transduction. Capacitive: highest sensitivity for small displacements (sub-femtofarad changes detectable), low power (no DC current), but susceptible to parasitic capacitance and requires nearby electronics. Piezoresistive: simpler readout (Wheatstone bridge), works at high temperature, but has 1/f noise and consumes DC power. Piezoelectric (AlN, PZT): self-generating (no bias needed), high bandwidth, but charge leaks at low frequency. Resonant: highest Q factor (10,000-100,000 in vacuum), frequency output, but complex drive circuitry.
3. Size the mechanical structure. For a capacitive accelerometer: sensitivity = x/a = 1/omega_n^2 where omega_n = sqrt(k/m). Target resonant frequency sets the bandwidth (3dB bandwidth approximately at resonance). Larger proof mass m gives lower noise floor (Brownian noise acceleration: a_n = sqrt(4*k_B*T*omega_n/(m*Q))). Typical consumer MEMS accelerometer: m = 0.5 ug, f_n = 5 kHz, noise floor = 100 ug/sqrt(Hz). Navigation grade: m = 10 ug, f_n = 500 Hz, noise floor = 1 ug/sqrt(Hz).
4. For a MEMS gyroscope, design the drive and sense modes. The proof mass vibrates in the drive mode (typically at 10-30 kHz, Q > 10,000 in vacuum). When rotated, Coriolis force (F = 2*m*v x omega) deflects the mass in the orthogonal sense direction. The sense displacement is proportional to angular rate. Mode matching (drive frequency = sense frequency) maximizes sensitivity but makes the sensor bandwidth narrow. Typical: 2-5 Hz split between modes for consumer, mode-matched for tactical grade.
5. Estimate the fundamental noise floor. Mechanical-thermal (Brownian) noise sets the floor for open-loop sensors. For a capacitive accelerometer: NEA = sqrt(4*k_B*T*b/m^2) where b is the damping coefficient. At atmospheric pressure, squeeze-film damping dominates (Q ~ 1-10). In vacuum packaging, Q increases to 1,000-100,000, reducing the noise floor by 10-100x. Electronic noise from the readout ASIC must also be below the mechanical floor to be Brownian-limited.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
