# Cors Security Report

Produce the CORS security test report with findings, exploitation scenarios, and remediation.

## Inputs

- `cache-poison-results`: Cache poisoning results
- `exploitable-combinations`: Exploitable combinations found

## Outputs

- `cors-report`: Complete CORS security report
- `remediation-plan`: Prioritized remediation plan

## Process

1. Compile all findings with request/response evidence
2. Rate each finding by severity and exploitability
3. Recommend explicit origin whitelisting and proper credential policies

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
