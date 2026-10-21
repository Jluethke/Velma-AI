# Factorial Report Compiler

Compile the factorial experiment report: design summary, effect estimates, significance tests, response surfaces, optimal settings, and recommendations.

## Inputs

- `effect-ranking`: Ranked effects
- `anova-table`: Significance tests
- `optimal-settings`: Recommended factor settings

## Outputs

- `factorial-report`: Structured report of the factorial analysis
- `next-experiment-recommendation`: Whether to run additional experiments (augment, center points, response surface)

## Process

1. Summarize the design: factors, levels, runs, and resolution.
2. Present the effect estimates with the Pareto chart and ANOVA table.
3. Show the response surface plots for the key factor pairs.
4. Recommend the optimal settings and whether follow-up experiments are needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
