# Sensitivity Report Writer

Produce the sensitivity analysis report with parameter rankings, interaction findings, and recommendations for model refinement.

## Inputs

- `influence-ranking`: Ranked parameter list
- `interaction-pairs`: Significant interactions
- `run-log`: Computational cost and completion summary

## Outputs

- `sensitivity-report`: Complete sensitivity analysis report
- `sensitivity-figures`: Tornado plot, scatter plots, and interaction heatmaps

## Process

1. Generate the tornado plot of first-order sensitivity indices.
2. Include scatter plots and heatmaps for the top interactions.
3. Write the methods section covering the SA method, sampling, and index computation.
4. Compile findings and recommendations for which parameters to measure more precisely.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
