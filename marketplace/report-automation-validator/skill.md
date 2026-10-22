# Report Automation Validator

Validate the automated reports and produce the setup document.

## Inputs

- `report-template`: Automated report template
- `delivery-schedule`: Generation and distribution schedule

## Outputs

- `validation-results`: Comparison of automated output against manual for three cycles
- `automation-setup-doc`: Documentation of the automated reporting system

## Process

1. Run the automated report in parallel with the manual report for three cycles.
2. Compare outputs and resolve any differences.
3. Document the setup, including how to modify the report and troubleshoot failures.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
