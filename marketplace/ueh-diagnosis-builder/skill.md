# Ueh Diagnosis Builder

Diagnose structural versus cash flow problems.

## Inputs

- `ltv-cac-ratio`: The ratio to test against the health line
- `cac-payback-months`: The payback to test against the time line

## Outputs

- `health-diagnosis`: Whether the unit is healthy, structurally weak, or cash constrained
- `problem-flags`: The specific flags raised and the lever for each

## Process

1. Flag a ratio below three to one as a structural problem.
2. Flag a payback over twelve months as a cash flow problem.
3. Name the lever most likely to fix each flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
