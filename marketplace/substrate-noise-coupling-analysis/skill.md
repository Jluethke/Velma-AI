# Substrate Noise Coupling Analysis

Analyze noise injection into the substrate from digital switching and assess its impact on sensitive analog circuits sharing the die.

## Inputs

- `die-floorplan`: Block placement with analog and digital locations
- `switching-activity`: Digital switching current waveforms

## Outputs

- `substrate-noise-map`: Noise voltage at each analog block location from digital switching
- `mitigation-recommendations`: Guard ring, spacing, and biasing changes to reduce coupling below threshold

## Process

1. Digital circuits inject noise into the substrate through two mechanisms: (1) capacitive coupling from switching drains through the drain-substrate junction capacitance, (2) resistive coupling through substrate contacts carrying bounce current from simultaneous switching output (SSO).
2. Model the substrate as a 3D resistive network. Substrate resistivity in bulk CMOS is typically 10-20 Ohm*cm for p-type. For high-resistivity substrates (used in RF), 1000+ Ohm*cm. Higher resistivity provides better isolation at DC but worse at high frequency (less capacitive bypassing).
3. Calculate the coupling: noise voltage at the analog location = substrate noise current * mutual impedance between digital injector and analog sensor. The mutual impedance decreases with distance approximately as 1/r for a point source in a conductive half-plane.
4. Sensitive nodes in analog circuits: the bulk terminal of NMOS transistors sitting in the p-substrate. Substrate voltage variation modulates Vt through the body effect: delta_Vt = gamma * delta_Vsb / (2*sqrt(2*phi_F + Vsb)), where gamma is the body effect coefficient (typically 0.3-0.5 V^0.5).
5. Mitigation: (1) Deep n-well under sensitive analog NMOS (isolates from substrate noise by 20-40 dB), (2) Dense substrate contacts around analog blocks (reduce local substrate resistance), (3) Increase physical separation (each doubling of distance reduces coupling by approximately 6 dB), (4) Separate analog and digital VSS at the die level (connect at package only).
6. Simulate with a substrate extraction tool: extract the substrate RC network between identified aggressor and victim locations. Inject the digital switching current waveform and measure the voltage at analog nodes. Compare to the analog sensitivity threshold (e.g., 1 mV for a 10-bit ADC with 1V reference).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
