# Conducted Emission Measurement

Measure or estimate conducted emissions from the converter using a LISN, interpret the spectrum, and separate common mode from differential mode noise to guide filter design.

## Inputs

- `converter-under-test`: Switching converter with operating parameters: topology, switching frequency, input voltage, output power
- `emission-standard`: Target standard and class (CISPR 32 Class B, FCC Part 15B, EN 55032) with quasi-peak and average limits in dBuV

## Outputs

- `emission-spectrum`: Measured or estimated conducted emission spectrum from 150kHz to 30MHz showing peaks at switching frequency harmonics, with quasi-peak and average values relative to limits
- `cm-dm-separation`: Separated common mode and differential mode noise spectra, identifying which mode dominates at each frequency range

## Process

1. Set up the LISN (Line Impedance Stabilization Network) per CISPR 16: 50uH inductance, 50 ohm impedance at measurement port, on both line and neutral. The LISN provides a defined impedance for the measurement and isolates the test setup from mains noise.
2. Measure on each line (L and N for single-phase, or + and - for DC) separately. The quasi-peak detector has a charge time constant of 1ms and discharge of 160ms for CISPR Band B (150kHz-30MHz), which weights repetitive narrowband interference (switching harmonics) lower than broadband noise.
3. Separate CM and DM noise. DM noise: Vdm = (VL - VN) / 2. CM noise: Vcm = (VL + VN) / 2. Use two matched probes and add/subtract, or use a CM/DM separating network. Typically, DM dominates at lower frequencies (150kHz-5MHz, driven by switching current ripple), CM dominates at higher frequencies (above 5MHz, driven by dv/dt and parasitic capacitance to ground).
4. Estimate emissions before measurement (for design phase). DM: the fundamental is approximately Idm * 50ohm where Idm = delta_IL (inductor current ripple) for buck. Harmonics roll off at -20dB/decade for trapezoidal current, -40dB/decade for sinusoidal. CM: Icm = Cparasitic * dv/dt at the switching node. With 10pF parasitic to chassis and 100V/ns: Icm = 1mA peak.
5. Calculate the required filter attenuation at each critical frequency: Atten_required = Emission_measured - Limit + 6dB_margin. The 6dB margin accounts for production variation. Separate the DM and CM attenuation requirements since they are addressed by different filter components.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
