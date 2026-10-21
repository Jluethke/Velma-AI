# Dsc Measurement Run

Run differential scanning calorimetry to measure glass transition, melting, crystallization, and cure behavior.

## Inputs

- `sample-prep-protocol`: How the sample was prepared
- `instrument-queue`: DSC configuration from the prep step

## Outputs

- `dsc-thermogram`: Heat flow vs temperature curve with labeled transitions
- `dsc-parameters`: Extracted values: Tg, Tm, Tc, enthalpy of fusion, degree of crystallinity

## Process

1. Load the sample and reference into the DSC cell, seal the crucible, and purge with the specified gas.
2. Run the programmed temperature ramp (heat-cool-heat cycle for polymers, single ramp for metals).
3. Identify endothermic and exothermic events on the thermogram.
4. Extract onset, midpoint, and peak temperatures for each transition and compute enthalpies by integration.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
