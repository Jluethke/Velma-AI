# Composition Quantifier

Quantify sample composition from the combined DSC/TGA data: crystallinity from melting enthalpy, moisture content, organic/inorganic fractions.

## Inputs

- `transition-table`: DSC transitions with enthalpies
- `mass-loss-table`: TGA mass loss steps

## Outputs

- `composition-table`: Component fractions: moisture, volatiles, organic, inorganic, crystallinity
- `composition-method-notes`: How each fraction was calculated and what reference values were used

## Process

1. Calculate crystallinity: measured melting enthalpy / theoretical 100% crystalline enthalpy.
2. Assign moisture content from the first TGA mass loss step (below 120C).
3. Assign organic content from mass loss between 200C and 600C (in nitrogen).
4. Assign inorganic residue from the final mass in air or oxygen atmosphere.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
