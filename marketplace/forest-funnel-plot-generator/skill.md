# Forest Funnel Plot Generator

Generate the forest plot (individual and pooled estimates) and funnel plot (publication bias visual).

## Inputs

- `effect-size-table`: per-study effect sizes
- `pooled-result`: pooled estimate and CI
- `study-weights`: per-study weights

## Outputs

- `forest-plot`: forest plot with study labels, effect sizes, CIs, weights, and diamond
- `funnel-plot`: funnel plot of effect size vs standard error with pseudo-CI lines

## Process

1. Order studies by effect size or chronologically per convention
2. Draw the forest plot with individual CIs, weight squares, and pooled diamond
3. Draw the funnel plot with standard error on the y-axis and effect size on x
4. Overlay pseudo-confidence interval lines on the funnel plot

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
