# Idp Security Report

Compile identity provider assessment findings into a prioritized security report.

## Inputs

- `token-findings`: Token handling findings
- `mfa-bypass-findings`: MFA bypass findings
- `federation-findings`: Federation trust findings
- `logout-findings`: Logout and revocation findings

## Outputs

- `idp-security-report`: Complete identity provider security assessment report
- `remediation-plan`: Prioritized remediation actions

## Process

1. Classify findings by attack vector and severity
2. Map findings to authentication framework security requirements (OWASP ASVS)
3. Write remediation recommendations with implementation guidance
4. Produce the final report with risk ratings and an executive summary

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
