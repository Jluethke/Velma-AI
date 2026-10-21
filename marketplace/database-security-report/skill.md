# Database Security Report

Produce the database security audit report with all findings, risk ratings, and hardening recommendations.

## Inputs

- `privilege-findings`: Privilege audit findings
- `encryption-findings`: Encryption audit findings
- `audit-logging-findings`: Logging audit findings

## Outputs

- `database-security-report`: Complete database security audit report
- `database-hardening-checklist`: Instance-specific hardening checklist

## Process

1. Consolidate findings across all database instances with severity and affected instance details.
2. Write instance-specific hardening checklists with exact configuration changes.
3. Produce the executive summary with overall database risk posture.
4. Recommend process improvements (automated scanning, privilege reviews, rotation policies).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
