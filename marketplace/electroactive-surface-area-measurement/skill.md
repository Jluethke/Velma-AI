# Electroactive Surface Area Measurement

Determine the electroactive surface area from capacitance or redox probe measurements.

## Inputs

- `cv-data`: Cyclic voltammetry data from the scan rate study
- `electrode-setup`: Electrode geometry and electrolyte

## Outputs

- `surface-area`: Electroactive surface area in cm-squared and roughness factor relative to geometric area
- `surface-area-method`: Method used (double-layer capacitance, Randles-Sevcik with a known redox probe)

## Process

1. For capacitance method: measure charging current at multiple scan rates in non-faradaic region
2. Plot current vs scan rate and extract the double-layer capacitance from the slope
3. Convert capacitance to area using the standard specific capacitance for the material
4. For Randles-Sevcik: use peak current vs scan rate slope with a standard redox probe of known diffusion coefficient

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
