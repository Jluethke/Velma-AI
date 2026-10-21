# Electrochemical Impedance Measurement

Run electrochemical impedance spectroscopy and fit an equivalent circuit model.

## Inputs

- `electrode-setup`: Cell configuration and electrolyte
- `eis-parameters`: Frequency range, AC amplitude, and DC bias potential

## Outputs

- `eis-spectra`: Nyquist and Bode plots of impedance vs frequency
- `equivalent-circuit`: Best-fit circuit model with element values (Rs, Rct, Cdl, Warburg, CPE)

## Process

1. Set the DC bias to the open circuit potential or a potential of interest
2. Sweep frequency from high (100 kHz) to low (10 mHz) with a small AC perturbation
3. Plot the Nyquist diagram and identify semicircles, linear regions, and their physical meaning
4. Fit an equivalent circuit model and report the charge transfer resistance, double-layer capacitance, and diffusion parameters

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
