# Privesc Assessment Report

Compile privilege escalation findings into a prioritized report.

## Inputs

- `horizontal-findings`: Horizontal escalation findings
- `vertical-findings`: Vertical escalation findings
- `idor-findings`: IDOR findings
- `token-elevation-findings`: Token elevation findings

## Outputs

- `privesc-report`: Complete privilege escalation assessment report
- `remediation-plan`: Prioritized remediation actions for authorization flaws

## Process

1. Classify findings by escalation type and impact
2. Build attack chains showing how individual findings combine for greater impact
3. Map findings to OWASP access control requirements
4. Produce the final report with risk ratings, proof-of-concept details, and remediation steps

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
