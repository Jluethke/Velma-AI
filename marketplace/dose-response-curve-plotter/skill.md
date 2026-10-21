# Dose Response Curve Plotter

Plot the raw dose-response data with error bars and visually inspect the shape of the relationship.

## Inputs

- `cleaned-data`: Validated dose-response dataset
- `x-axis-scale`: Linear or log scale for dose axis

## Outputs

- `raw-curve-plot`: Scatter plot of dose vs. response with error bars
- `shape-assessment`: Visual assessment of monotonicity, saturation, and potential threshold

## Process

1. Plot individual data points and group means with standard error bars.
2. Display on both linear and log-dose scales.
3. Annotate apparent features (plateau, inflection point, threshold region).
4. Record the visual shape assessment to guide model selection.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
