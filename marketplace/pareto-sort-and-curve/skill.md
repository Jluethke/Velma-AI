# Pareto Sort And Curve

Sort inputs by output descending and calculate the cumulative percentage. This is the Pareto curve: the x-axis is the percentage of inputs, the y-axis is the cumulative percentage of output. The steeper the initial curve, the more concentrated your output is.

## Inputs

- `input-list`: All inputs
- `output-per-input`: Output produced by each input

## Outputs

- `sorted-inputs`: Inputs ranked from highest output to lowest, with cumulative output percentage at each row
- `concentration-ratio`: The percentage of inputs producing 80% of the output (the Pareto ratio)

## Process

1. Sort inputs by output descending. For each row, calculate: this input's output as a percentage of total, and the running cumulative percentage.
2. Find the row where the cumulative output crosses 80%. Count what percentage of inputs are above that line. That is your Pareto ratio. Classic is 20/80, but real data varies (10/90 is common, 30/70 also common).
3. If the ratio is close to 50/50, the distribution is even and Pareto prioritization has limited value. If it is 10/90 or more extreme, the prioritization opportunity is large.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
