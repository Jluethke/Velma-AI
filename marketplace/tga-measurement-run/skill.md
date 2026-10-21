# Tga Measurement Run

Run thermogravimetric analysis to measure decomposition temperature, mass loss steps, and residue content.

## Inputs

- `sample-prep-protocol`: Sample preparation details
- `instrument-queue`: TGA configuration

## Outputs

- `tga-curve`: Mass loss vs temperature curve with derivative (DTG)
- `tga-parameters`: Onset of decomposition, mass loss per step, residue percentage

## Process

1. Load the sample into the TGA pan and tare the balance.
2. Run the temperature program under specified atmosphere (nitrogen for decomposition, air for oxidation).
3. Compute the derivative thermogravimetry (DTG) curve to resolve overlapping mass loss steps.
4. Determine onset temperature, inflection point, and residue mass at final temperature.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
