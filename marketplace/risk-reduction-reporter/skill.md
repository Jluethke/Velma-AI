# Risk Reduction Reporter

Report on overall risk reduction from the vulnerability management cycle.

## Inputs

- `verification-results`: Verified fix and regression data
- `reopen-list`: Items that failed verification

## Outputs

- `vuln-management-report`: Full cycle report with findings, remediation rates, and risk reduction
- `risk-trend-data`: Trend data showing risk reduction over time across scan cycles

## Process

1. Calculate the overall remediation rate and average time to remediate by severity
2. Compute risk reduction: total risk score at scan vs total remaining risk
3. Compare against previous cycles to show trend
4. Highlight persistent risks and recommend process improvements

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
