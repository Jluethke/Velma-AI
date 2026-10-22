# Baseline Time Measurer

Measure the current time-to-productivity for the last 5-10 hires. For each hire, determine when they reached each milestone and when they reached full productivity. If this data does not exist, estimate it by interviewing the managers and the new hires. The baseline is the number you are trying to improve.

## Inputs

- `productivity-definition`: The measurable criteria for full productivity
- `milestone-ladder`: The intermediate milestones

## Outputs

- `baseline-measurements`: Time-to-productivity for each recent hire, with milestone dates, producing a median baseline
- `variance-analysis`: The spread in time-to-productivity across hires, and any obvious factors that explain the variance (e.g., hires with prior industry experience ramp faster)

## Process

1. For each of the last 5-10 hires in this role, determine when they reached each milestone and full productivity.
2. If milestone dates were not tracked, interview the manager: When could this person handle [milestone task] independently? Estimate to the nearest week.
3. Calculate the median time-to-productivity. This is the baseline.
4. Look at the variance. If the fastest hire reached productivity in 4 weeks and the slowest in 16, something in the process is inconsistent. Identify what was different for the fast hires.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
