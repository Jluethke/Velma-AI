# Security Architecture Report Compiler

Compile all findings into the security architecture review report with risk ratings and recommendations.

## Inputs

- `authn-assessment`: Authentication and authorization findings
- `encryption-assessment`: Encryption and data protection findings
- `segmentation-findings`: Network segmentation findings
- `forensic-readiness-score`: Forensic logging readiness score

## Outputs

- `security-architecture-report`: Complete security architecture review report
- `prioritized-remediation-list`: Ranked list of remediation actions by risk severity

## Process

1. Consolidate findings from all assessment areas
2. Rate each finding by severity (critical, high, medium, low) using likelihood and impact
3. Write remediation recommendations for each finding
4. Produce the final report with executive summary, detailed findings, and prioritized action plan

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
