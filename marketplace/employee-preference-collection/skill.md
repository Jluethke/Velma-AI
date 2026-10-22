# Employee Preference Collection

Collect employee shift preferences, constraints, and availability for the scheduling period.

## Inputs

- `shift-types`: The defined shift types
- `coverage-matrix`: Coverage requirements by shift and day

## Outputs

- `employee-preferences`: Each employee's preferred shifts, hard constraints, and availability for the period
- `preference-summary`: Summary showing which shifts are overstaffed and understaffed based on preferences

## Process

1. Send the preference form to all eligible employees for the upcoming scheduling period.
2. Collect: preferred shifts (ranked), days they cannot work (with reason), overtime willingness, and swap willingness.
3. Summarize preferences against the coverage matrix to identify which shifts will be easy to fill and which will be short.
4. Flag employees who have not submitted preferences by the deadline.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
