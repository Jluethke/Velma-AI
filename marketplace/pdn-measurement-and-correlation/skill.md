# Pdn Measurement And Correlation

Measure the built PDN impedance using VNA or probing techniques, correlate with simulation, and iterate the model for accuracy on future designs.

## Inputs

- `pdn-impedance-curve`: Simulated PDN impedance to correlate against
- `margin-analysis`: Predicted margin to compare with measured
- `capacitor-bill-of-materials`: Actual components placed for measurement comparison

## Outputs

- `measured-pdn-impedance`: Measured impedance vs frequency at the IC power pin location
- `simulation-correlation-report`: Comparison of simulated vs measured impedance with RMS error and identification of model inaccuracies
- `model-correction-factors`: Corrections to apply to future simulations: adjusted ESL for specific packages, actual plane capacitance vs calculated, VRM output impedance at temperature

## Process

1. Measure PDN impedance at the IC power pin using a 2-port shunt-through VNA measurement (preferred) or a 1-port measurement with a short SMA probe. The 2-port method gives better dynamic range below 10 milliohms. De-embed the probe and cable contribution.
2. Overlay the measured impedance on the simulated curve. Expect agreement within 3 dB (factor of 1.4) across most of the frequency range. Differences above 6 dB indicate a model error that needs investigation.
3. Common model errors: plane capacitance is often 10 to 20% lower than calculated due to via antipads reducing effective area. ESL of capacitors is higher than datasheet values because the datasheet ESL does not include mounting pad and via inductance. VRM output impedance changes with load and temperature.
4. Record correction factors for each discrepancy. Apply these corrections to the component library and simulation methodology for future designs. A PDN design team that correlates every design builds accuracy over time. A team that never measures repeats the same errors.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
