# Ratio Requirements Calculator

Calculate the minimum staff needed by time block based on enrollment and ratio requirements.

## Inputs

- `enrollment-by-classroom`: Number of enrolled children by age group and classroom
- `ratio-requirements`: State-mandated staff-to-child ratios by age group

## Outputs

- `staffing-minimums`: Minimum staff required by classroom and time block (open, midday, close)
- `coverage-gaps`: Time blocks where current staffing levels are below minimum

## Process

1. Calculate the required staff count for each classroom based on enrollment and the mandated ratio.
2. Map the staffing needs across the full operating day, accounting for staggered arrivals and departures.
3. Identify the peak staffing periods (usually mid-morning to mid-afternoon).
4. Flag any time blocks where the current staff count would violate ratio requirements.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
