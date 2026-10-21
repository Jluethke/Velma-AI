# Cloud Security Report

Produce the cloud infrastructure security audit report with findings, compliance status, and remediation priorities.

## Inputs

- `benchmark-results`: CIS benchmark test results
- `compliance-score`: Overall compliance score

## Outputs

- `cloud-audit-report`: Complete cloud security audit report
- `remediation-roadmap`: Prioritized remediation plan with estimated effort

## Process

1. Consolidate all findings with severity, affected resources, and CIS control mapping.
2. Write the executive summary with overall risk posture and compliance score.
3. Document each finding with evidence, impact, and specific remediation steps.
4. Produce a remediation roadmap ordered by risk reduction per unit effort.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
