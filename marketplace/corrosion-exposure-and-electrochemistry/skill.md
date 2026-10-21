# Corrosion Exposure And Electrochemistry

Expose specimens and run electrochemical measurements: open circuit potential, polarization curves, and impedance spectroscopy.

## Inputs

- `prepared-corrosion-specimens`: Ready specimens
- `selected-test-methods`: Which electrochemical tests to run

## Outputs

- `electrochemical-data`: OCP vs time, polarization curves, and EIS spectra
- `mass-loss-data`: Post-exposure mass after cleaning off corrosion products

## Process

1. For electrochemical tests: mount the specimen as the working electrode, immerse, and stabilize the open circuit potential.
2. Run potentiodynamic polarization to get corrosion potential and corrosion current density.
3. Run electrochemical impedance spectroscopy (EIS) to characterize the corrosion interface.
4. For immersion or salt spray: expose for the specified duration, then clean and weigh to determine mass loss.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
