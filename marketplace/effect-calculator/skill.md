# Effect Calculator

Calculate main effects and interaction effects: the average change in response when each factor moves from low to high.

## Inputs

- `design-matrix`: Coded factors and responses
- `design-properties`: Design structure and aliasing

## Outputs

- `effect-estimates`: Each effect (main and interaction) with its magnitude and sign
- `effect-ranking`: Effects sorted by absolute magnitude

## Process

1. Compute each main effect: average response at high level minus average at low level.
2. Compute each interaction effect: half the difference of a factor's effect at the other factor's levels.
3. For higher-order interactions, apply the sign-table method.
4. Rank effects by absolute magnitude to identify the most influential factors.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
