# Jwt Assessment Report

Compile JWT security assessment findings into a report with remediation guidance.

## Inputs

- `algorithm-confusion-results`: Algorithm confusion findings
- `key-strength-results`: Key strength findings
- `claim-manipulation-results`: Claim manipulation findings
- `leakage-findings`: Token leakage findings

## Outputs

- `jwt-security-report`: Prioritized JWT security assessment report
- `jwt-remediation-guide`: Remediation steps for each JWT vulnerability

## Process

1. Rank findings by severity (key recovery > algorithm confusion > leakage)
2. Document proof-of-concept exploitation steps for each finding
3. Write remediation guidance (algorithm pinning, key rotation, short TTLs)
4. Produce the final report with technical detail and executive summary

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
