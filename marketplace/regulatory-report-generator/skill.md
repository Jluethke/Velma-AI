# Regulatory Report Generator

Generate the report in the required format and validate against regulatory rules.

## Inputs

- `collected-data`: Validated data for reporting
- `data-quality-flags`: Items reviewed and resolved

## Outputs

- `generated-reports`: Reports in the required format (XML, XBRL, CSV, PDF)
- `validation-results`: Results of edit checks and cross-report consistency

## Process

1. Generate each report in the format required by the regulator.
2. Run the regulatory edit checks (quality, validity, reasonability).
3. Fix any failures and regenerate until clean.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
