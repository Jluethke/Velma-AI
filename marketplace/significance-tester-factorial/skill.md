# Significance Tester Factorial

Test which effects are statistically significant: ANOVA, normal probability plot of effects, or Lenth's method for unreplicated designs.

## Inputs

- `effect-estimates`: All estimated effects
- `design-properties`: Whether the design is replicated or unreplicated

## Outputs

- `anova-table`: Source, sum of squares, df, mean square, F-ratio, and p-value for each effect
- `significant-effects`: Effects that pass the significance threshold

## Process

1. If replicated, use ANOVA with pure error from replicates.
2. If unreplicated, use a normal probability plot of effects or Lenth's pseudo-standard-error.
3. Compute the F-ratio and p-value for each effect.
4. Apply a multiple-comparison correction if testing many effects simultaneously.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
