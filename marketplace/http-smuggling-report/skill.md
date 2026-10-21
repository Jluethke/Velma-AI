# Http Smuggling Report

Produce the HTTP request smuggling test report with all findings and remediation steps.

## Inputs

- `credential-exposure-findings`: Credential exposure findings
- `impact-severity`: Severity ratings

## Outputs

- `smuggling-report`: Complete HTTP request smuggling test report
- `remediation-plan`: Prioritized remediation plan

## Process

1. Compile all findings with proof-of-concept request/response pairs
2. Rate each finding by CVSS severity
3. Write remediation recommendations focusing on server normalization

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
