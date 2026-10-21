# Xxe Assessment Report

Produce the XXE assessment report with all findings, payloads, and remediation steps.

## Inputs

- `ssrf-results`: SSRF results
- `internal-services-reached`: Internal services reached

## Outputs

- `xxe-report`: Complete XXE assessment report
- `remediation-plan`: Prioritized remediation plan

## Process

1. Compile all findings with payload examples and evidence
2. Rate each finding by CVSS severity
3. Recommend disabling external entities, using safe parsers, and input validation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
