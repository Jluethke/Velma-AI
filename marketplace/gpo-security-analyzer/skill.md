# Gpo Security Analyzer

Analyze Group Policy Objects for security settings and misconfigurations.

## Inputs

- `domain-structure`: Domain, OU, and GPO hierarchy
- `domain-credentials`: Credentials to read GPO settings

## Outputs

- `gpo-findings`: Weak GPO settings, password policy gaps, and audit policy gaps
- `gpo-security-baseline-comparison`: Comparison of current settings against Microsoft security baselines

## Process

1. Export and analyze all GPO settings (password policy, lockout, audit, user rights assignments)
2. Compare password and lockout policies against current best practices
3. Check audit policies for coverage of logon events, privilege use, and object access
4. Compare against Microsoft Security Compliance Toolkit baselines

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
