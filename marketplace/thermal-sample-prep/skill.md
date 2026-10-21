# Thermal Sample Prep

Prepare samples for thermal analysis by selecting geometry, mass, and crucible type appropriate for each instrument.

## Inputs

- `material-description`: Identity and form of the material to analyze
- `analysis-objectives`: Which thermal properties are needed (Tg, Tm, Td, modulus)

## Outputs

- `sample-prep-protocol`: Step-by-step sample preparation instructions per instrument
- `instrument-queue`: Ordered list of instruments to run and their configurations

## Process

1. Identify the material type (polymer, ceramic, metal, composite) and select appropriate crucible and atmosphere.
2. Calculate target sample mass for each instrument based on expected heat flow and sensitivity.
3. Specify cutting, grinding, or molding steps to achieve the required sample geometry.
4. Define storage and handling conditions to prevent moisture uptake or degradation before measurement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
