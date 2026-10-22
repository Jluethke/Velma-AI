# S Parameter Measurement Vna

Measure S-parameters of PCB traces, connectors, and cables using a vector network analyzer with proper calibration and de-embedding to isolate the device under test.

## Inputs

- `impedance-profile`: TDR data identifying features to characterize in frequency domain
- `target-impedance-spec`: Impedance and loss specifications

## Outputs

- `s-parameter-data`: Full 2-port (or 4-port for differential) S-parameter data in Touchstone format: S11 (return loss), S21 (insertion loss), S12 (reverse isolation), S22 (far-end return loss)
- `channel-loss-budget`: Insertion loss vs frequency with identified loss contributors (dielectric loss, conductor loss, connector loss, via transitions)
- `impedance-match-quality`: Return loss vs frequency showing bandwidth of acceptable impedance match

## Process

1. Select VNA calibration method. For coaxial fixtures, use SOLT (Short-Open-Load-Thru) with characterized calibration standards. For PCB fixtures, use TRL (Thru-Reflect-Line) which is more accurate because it uses the PCB transmission line itself as the calibration standard, eliminating fixture de-embedding errors.
2. For TRL calibration, fabricate three calibration structures on the same PCB as the DUT: a Thru (direct connection between ports), a Reflect (open or short at each port), and a Line (a transmission line longer than the Thru by a quarter wavelength at the center frequency). The Line length sets the calibration bandwidth: one Line covers about 8:1 frequency range.
3. Measure S21 (insertion loss): a smooth downward slope with frequency indicates dielectric and conductor loss (normal). Sharp dips or resonances indicate impedance discontinuities causing reflections. Compare measured insertion loss to the PCB material specification (Dk and Df at frequency).
4. Measure S11 (return loss): should be below -10dB (preferably below -15dB) across the signal bandwidth. Peaks in S11 correspond to impedance discontinuities. Correlate S11 peaks with TDR discontinuity locations to identify which physical feature causes each reflection.
5. For differential channels, measure full 4-port S-parameters (SDD11, SDD21, SCC11, SCC21, SDC21, SCD21). Mixed-mode S-parameters separate differential and common mode behavior. SDC21 (differential-to-common mode conversion) indicates impedance imbalance between the two traces of a differential pair.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
