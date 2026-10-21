# Naa Isotope Identification

Identify radioisotopes in the gamma spectra by matching photopeaks to known energies.

## Inputs

- `gamma-spectra`: Raw gamma spectra from all counting sessions
- `analysis-goals`: Target element list to guide peak search

## Outputs

- `peak-assignments`: Each identified photopeak with isotope, energy, net area, and uncertainty
- `interference-flags`: Peaks where multiple isotopes overlap and require correction

## Process

1. Calibrate the energy axis using known calibration sources
2. Run automatic peak search and fit Gaussian peaks to extract net areas
3. Match peak energies to the isotope library and assign each peak
4. Flag spectral interferences where two isotopes contribute to the same energy region

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
