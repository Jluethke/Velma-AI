# Corrosion Rate Calculator

Calculate corrosion rates from mass loss and electrochemical data and rank materials.

## Inputs

- `mass-loss-data`: Post-exposure mass measurements
- `electrochemical-data`: Polarization and EIS results

## Outputs

- `corrosion-rates`: Corrosion rate in mm/year from mass loss and from Tafel extrapolation
- `material-ranking`: Materials ranked by corrosion resistance with statistical confidence

## Process

1. Calculate mass loss corrosion rate: (mass loss * K) / (area * time * density), where K converts to mm/year.
2. Extract corrosion current density from Tafel extrapolation and convert to mm/year using Faraday's law.
3. Compare mass loss and electrochemical rates and note any discrepancy (passivation, localized attack).
4. Rank materials and report mean and standard deviation across replicates.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
