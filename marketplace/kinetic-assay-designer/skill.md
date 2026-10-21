# Kinetic Assay Designer

Design the enzyme kinetic assay including substrate range, enzyme concentration, and detection method.

## Inputs

- `enzyme-info`: Enzyme name, source, purity, and known properties
- `substrate-info`: Substrate identity, solubility, and approximate Km if known
- `detection-method`: Spectrophotometric, fluorometric, or coupled assay details

## Outputs

- `assay-protocol`: Complete assay protocol with concentrations, volumes, and timing
- `substrate-range`: Substrate concentrations to test (spanning 0.2x to 5x estimated Km)

## Process

1. Select the enzyme concentration that gives linear product formation over the measurement window
2. Define the substrate concentration series spanning well below and above the estimated Km
3. Set buffer conditions (pH, temperature, cofactors, ionic strength)
4. Define the detection method and its linear range for the product

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
