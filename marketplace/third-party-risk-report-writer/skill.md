# Third Party Risk Report Writer

Compile the third-party risk assessment report.

## Inputs

- `api-security-findings`: API security findings
- `data-handling-findings`: Data handling findings
- `vendor-access-findings`: Access control findings
- `continuity-risk-assessment`: Business continuity risk assessment

## Outputs

- `third-party-risk-report`: Complete third-party risk assessment report
- `vendor-risk-register`: Risk register with each vendor's risk rating and required actions

## Process

1. Rate each vendor on a risk scale based on data sensitivity, access level, and security posture
2. Write the executive summary with the highest-risk vendors highlighted
3. Detail each finding with the affected vendor, evidence, and recommended action
4. Produce the vendor risk register with review cadence for each risk tier

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
