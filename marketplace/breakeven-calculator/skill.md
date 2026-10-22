# Breakeven Calculator

Compute the break-even horizon and test it against the rule that build should not exceed about two years of manual cost. If the automation takes longer than two years to pay back, the honest answer is usually not to build it.

## Inputs

- `annual-manual-hours`: Yearly manual hours
- `build-hours`: One-time build hours
- `annual-maintenance-hours`: Yearly maintenance hours

## Outputs

- `breakeven-months`: Months until the automation pays back its build and maintenance
- `two-year-verdict`: Whether payback falls inside the two-year rule

## Process

1. Compute the net yearly saving as annual manual hours minus annual maintenance hours.
2. Divide build hours by the net yearly saving to get the payback time in months.
3. Compare the payback against the two-year rule and record a pass or fail.
4. Flag the case where maintenance meets or exceeds manual cost, which means it never pays back.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
