# Vna Calibration Methodology

Calibrate a vector network analyzer for accurate S-parameter measurement using the appropriate calibration method for the measurement scenario.

## Inputs

- `measurement-scenario`: What is being measured: coaxial DUT, on-wafer device, PCB fixture, waveguide component. Frequency range and port configuration.
- `calibration-standards`: Available calibration kit: SOLT (short-open-load-thru), TRL (thru-reflect-line), or electronic calibration module (ECal)

## Outputs

- `calibration-procedure`: Step-by-step calibration procedure for the measurement scenario, including the standards to apply and the order
- `calibration-verification`: Methods to verify calibration quality before proceeding with measurements

## Process

1. SOLT calibration (most common for coaxial measurements): connect Short, Open, Load (50 ohm), and Thru standards at the measurement plane. The VNA uses the known response of these standards to calculate 12 error terms (for a full 2-port calibration). Use the calibration kit matched to the connector type.
2. TRL calibration (for non-coaxial or high-accuracy measurements): requires a Thru (zero-length or known length), Reflect (short or open, same at both ports), and Line (transmission line of known impedance, length approximately lambda/4 at the center frequency). TRL is self-calibrating: the line impedance defines the reference impedance, and the reflect does not need to be characterized.
3. For on-wafer measurements (probing a chip or MMIC): use TRL or multiline TRL with on-wafer calibration standards fabricated on the same substrate. This de-embeds the probe-to-wafer transition. Verify by measuring a known on-wafer verification standard (through line of known length).
4. For fixture-based measurements (PCB test fixture): calibrate at the fixture connectors with SOLT, then de-embed the fixture using time-domain gating or a fixture characterization (measure the fixture itself and mathematically remove its effect).
5. Verify calibration quality: measure a known standard not used in the calibration (verification standard). For example, after SOLT calibration, measure a precision airline (known impedance and length). The measured S11 should be below -40 dB and S21 should match the airline's calculated loss. Also check that the Smith chart trace for an open is on the right side and for a short is on the left.
6. Note the calibration valid frequency range and the reference plane location. All subsequent measurements are only valid within this range and at this plane.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
