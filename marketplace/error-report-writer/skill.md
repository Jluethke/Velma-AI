# Error Report Writer

Write the measurement uncertainty report: suitable for a calibration certificate, a methods section, or an internal quality record.

## Inputs

- `uncertainty-budget`: The budget table
- `improvement-targets`: Where to improve
- `expanded-uncertainty`: Final stated uncertainty

## Outputs

- `uncertainty-report`: Structured report of the uncertainty analysis
- `measurement-result-statement`: The final result with uncertainty in standard notation

## Process

1. Write the measurand description and the measurement procedure.
2. Present the uncertainty budget table.
3. State the measurement result: value, expanded uncertainty, coverage factor, and confidence level.
4. List recommendations for reducing uncertainty if the current level is insufficient.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
