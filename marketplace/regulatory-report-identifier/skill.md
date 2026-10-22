# Regulatory Report Identifier

Identify the required reports and filing deadlines.

## Inputs

- `institution-type`: Charter type and regulators (OCC, FDIC, Fed, state)
- `reporting-period`: Quarter or year-end being reported

## Outputs

- `required-reports`: List of reports due (call report, HMDA, CRA, BSA, FR Y-9C) with deadlines
- `data-requirements`: Data fields and sources needed for each report

## Process

1. Identify all reports required based on institution type, size, and charter.
2. Determine the filing deadlines for the reporting period.
3. Map the data requirements for each report to source systems.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
