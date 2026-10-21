# Transition Identifier

Identify thermal transitions in DSC data: glass transitions (Tg), melting points (Tm), crystallization (Tc), and decomposition onsets.

## Inputs

- `preprocessed-curves`: Baseline-corrected DSC curve
- `sample-metadata`: Expected material type for transition identification context

## Outputs

- `transition-table`: Each transition with type, onset temperature, peak temperature, and enthalpy
- `transition-assignments`: What physical process each transition represents

## Process

1. Identify step changes in heat capacity (glass transitions) and their midpoint Tg.
2. Identify endothermic peaks (melting) and exothermic peaks (crystallization, curing).
3. Measure onset temperature (tangent intersection), peak temperature, and endset temperature.
4. Integrate peak area to determine enthalpy (J/g) for each transition.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
