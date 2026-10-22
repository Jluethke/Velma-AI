# Buckling And Stability Analysis

Analyze buckling stability of thin-walled launch vehicle structures under compression and combined loading.

## Inputs

- `tank-wall-design`: Wall construction, thickness, and stiffening
- `design-load-envelopes`: Compression, shear, and bending loads at each station

## Outputs

- `buckling-margins`: Margin of safety against buckling for each structural section under each load case
- `knockdown-factors`: Applied imperfection sensitivity factors with justification
- `stiffener-optimization`: Ring frame and stringer sizing for minimum mass at required buckling margin

## Process

1. Classical buckling stress for a perfect thin-walled cylinder under axial compression: sigma_cr = 0.605 * E * t / r. But real cylinders buckle at 20-60% of this value due to geometric imperfections. The knockdown factor gamma depends on r/t ratio, manufacturing quality, and boundary conditions.
2. NASA SP-8007 provides empirical knockdown factors for monocoque cylinders. For r/t = 500 (typical tank), gamma = 0.3-0.4. More modern approaches use measured imperfection data and nonlinear FEA to compute less conservative (but still safe) knockdown factors.
3. For stiffened shells (isogrid, orthogrid, skin-stringer), global buckling (panel buckling between ring frames) and local buckling (skin buckling between stringers) must both be checked. The critical mode depends on the relative stiffness of skin and stiffeners. Both global and local modes need positive margin.
4. Combined loading: axial compression + bending + internal pressure. Internal pressure actually stabilizes the shell against buckling (tension in the hoop direction stiffens the wall). This is why pressure-stabilized tanks work: the tank must maintain minimum pressure at all times during handling and flight.
5. Qualification: demonstrate buckling margin by test on a full-scale or subscale article. The test article must have representative imperfections. Load to 1.25x or 1.40x limit load (depending on the factor of safety approach: ultimate or limit-based). Correlation of test with analysis validates the knockdown factors.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
