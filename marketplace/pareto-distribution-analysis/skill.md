# Pareto Distribution Analysis

Analyze the distribution: what percentage of inputs produces what percentage of outputs? Plot the cumulative curve.

## Inputs

- `input-output-data`: Sorted table of inputs and outputs
- `total-output`: Total output

## Outputs

- `pareto-curve`: Cumulative percentage: for each input added in order, what cumulative percentage of total output has been reached
- `pareto-ratio`: The actual ratio (e.g., 18% of customers produce 82% of revenue). It is rarely exactly 80/20 but the concentration is always present.

## Process

1. Calculate each input's share of total output as a percentage.
2. Build the cumulative curve: first input contributes X%, first two inputs contribute X+Y%, and so on.
3. Find the knee of the curve: the point where adding the next input contributes significantly less than the previous one. This separates the vital few from the trivial many.
4. State the actual Pareto ratio. It might be 15/85 or 25/75. The exact ratio does not matter; what matters is that a small number of inputs produce a disproportionate share of outputs.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
