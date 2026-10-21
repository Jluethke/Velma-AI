# Extension Security Report Compiler

Compile all findings into a prioritized security report with remediation guidance.

## Inputs

- `xss-findings`: XSS vulnerabilities from UI testing
- `privilege-escalation-paths`: Privilege escalation findings
- `data-exposure-inventory`: Data exposure inventory
- `library-vulnerability-report`: Third-party library vulnerabilities

## Outputs

- `extension-security-report`: Full security assessment report
- `remediation-priority-list`: Prioritized list of fixes

## Process

1. Aggregate and deduplicate findings across all assessment phases
2. Score each finding by CVSS or equivalent severity
3. Write remediation guidance for each finding
4. Produce the final report with executive summary and technical detail

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
