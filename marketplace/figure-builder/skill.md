# Figure Builder

Build the figure: plot the data with proper axis labels, tick formatting, error bars, statistical annotations, and legend placement.

## Inputs

- `encoding-plan`: The visual encoding spec
- `style-config`: Style parameters
- `data-summary`: The data to plot

## Outputs

- `draft-figure`: The rendered figure before accessibility and final checks
- `annotation-list`: All statistical annotations and callouts included

## Process

1. Create the plot with the specified chart type and encoding.
2. Add axis labels with units, properly formatted tick marks, and a legend if needed.
3. Add error bars (standard error, confidence interval, or standard deviation, stated in the caption).
4. Add statistical annotations (significance brackets, p-values, effect sizes) where appropriate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
