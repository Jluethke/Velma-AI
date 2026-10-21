# Behavioral Contrast Visualizer

Visualize the key experimental contrasts to communicate the pattern of results.

## Inputs

- `subject-summaries`: Summary metrics per condition
- `model-results`: Statistical test results indicating which contrasts are significant

## Outputs

- `contrast-figures`: Bar or violin plots with error bars and significance annotations
- `individual-data-plots`: Plots showing individual subject data points alongside group means

## Process

1. Create bar or violin plots of the key conditions with within-subject error bars (Cousineau-Morey).
2. Overlay individual subject data points to show the distribution.
3. Add significance brackets for planned contrasts or post-hoc tests.
4. If there is an interaction, plot simple effects to decompose it.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
