# Chart Type Selector

Select the right chart type for the data and the message: the chart type follows from what comparison the reader needs to make.

## Inputs

- `data-summary`: Variable types, number of groups, and the intended comparison
- `message-to-convey`: What the figure should show the reader

## Outputs

- `chart-type`: The selected chart type with rationale
- `encoding-plan`: Which variable maps to which visual channel (x, y, color, size, facet)

## Process

1. Classify the comparison type: distribution, relationship, composition, trend, or spatial.
2. Match the comparison type and variable types to a chart family (bar, scatter, line, box, heatmap, etc.).
3. Check that the number of data points and groups is appropriate for the chosen type.
4. Define the visual encoding: which variable goes on which axis and channel.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
