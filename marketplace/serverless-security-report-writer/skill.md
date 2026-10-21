# Serverless Security Report Writer

Compile the serverless security review report.

## Inputs

- `iam-findings`: IAM privilege findings
- `injection-test-results`: Event injection results
- `trust-boundary-findings`: Trust boundary issues
- `abuse-test-results`: Resource abuse test results

## Outputs

- `serverless-security-report`: Complete serverless security review report
- `remediation-actions`: Prioritized list of fixes with implementation guidance

## Process

1. Organize findings by severity across all test categories
2. Write the executive summary with risk posture assessment
3. Detail each finding with evidence, impact, and remediation steps
4. Produce the remediation action list with priority and effort estimates

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
