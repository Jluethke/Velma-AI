# Noise Figure Measurement Verification

Measure the noise figure of the receiver chain or individual components using the Y-factor method or cold-source method, and verify against the design target.

## Inputs

- `lna-selection`: Selected LNA with expected NF
- `cascaded-noise-figure`: Expected system NF
- `receiver-chain-components`: Complete receiver chain for measurement

## Outputs

- `measured-noise-figure`: Measured NF of the LNA and the complete receiver chain, with measurement uncertainty analysis
- `noise-performance-verification`: Comparison of measured NF to the design budget, identifying any stages that are worse than expected

## Process

1. Y-factor method: connect a calibrated noise source (with known ENR, excess noise ratio) to the device input. Measure the output power with the noise source on (hot) and off (cold). Y = P_hot/P_cold. Then NF = ENR / (Y - 1) in linear, or NF_dB = ENR_dB - 10*log10(Y - 1).
2. Correct for the noise source's ENR accuracy: ENR varies with frequency and temperature. Use the calibration data provided with the noise source, not the nominal value printed on the label.
3. For the cold-source method (more accurate for low NF): use a calibrated impedance at room temperature as the cold source and a known impedance at an elevated temperature (or a noise diode) as the hot source. This avoids the ENR uncertainty of the noise source.
4. Measure the LNA NF first in isolation. Then measure the complete chain. If the chain NF is worse than predicted from the Friis equation using the measured stage NFs, there is an unexpected loss or impedance mismatch between stages.
5. Assess measurement uncertainty: noise source ENR uncertainty (typically 0.1 to 0.2 dB), mismatch uncertainty between noise source and DUT, noise figure analyzer internal noise contribution. Total measurement uncertainty is typically 0.2 to 0.5 dB for NF below 3 dB.
6. If measured NF exceeds the budget, diagnose by measuring each stage individually. Common causes of excess NF: lossy connectors or transitions before the LNA, oscillation at out-of-band frequencies, bias circuit noise injection, substrate coupling on the PCB.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
