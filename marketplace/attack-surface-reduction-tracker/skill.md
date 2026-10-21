# Attack Surface Reduction Tracker

Track attack surface reduction over time and produce the management report.

## Inputs

- `trend-data`: Attack surface size metrics over time
- `vuln-management-tickets`: Remediation ticket status
- `prioritized-risks`: Current risk posture

## Outputs

- `attack-surface-report`: Report showing current posture, trends, and remediation progress
- `reduction-metrics`: Month-over-month change in asset count, exposed services, and high-risk findings

## Process

1. Compute month-over-month changes in total assets, exposed services, and high-risk findings
2. Track remediation ticket closure rates against SLAs
3. Highlight new risks introduced since the last report
4. Produce the executive summary with trend charts

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
