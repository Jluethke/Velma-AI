# Regulatory Compliance Checker

Check each parameter against applicable regulatory standards: drinking water limits, ambient criteria, or discharge permit limits.

## Inputs

- `compiled-results`: Measured parameter values
- `applicable-standards`: Regulatory limits for the waterbody's designated use

## Outputs

- `compliance-table`: Each parameter with its measured value, standard, and pass/fail status
- `exceedance-summary`: Number and magnitude of exceedances by parameter and site

## Process

1. Match each measured parameter to its applicable standard (acute, chronic, or maximum contaminant level).
2. Compare the measured value to the standard and flag exceedances.
3. For exceedances, calculate the magnitude (how many times the standard was exceeded).
4. Identify patterns: which sites, parameters, or seasons have the most exceedances.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
