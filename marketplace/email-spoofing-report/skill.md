# Email Spoofing Report

Compile email spoofing assessment findings into a prioritized report.

## Inputs

- `external-spoof-results`: External spoofing results
- `internal-spoof-results`: Internal spoofing results
- `display-name-results`: Display name spoofing results

## Outputs

- `email-spoof-report`: Prioritized email spoofing assessment report
- `email-remediation-guide`: Remediation for each spoofing vulnerability

## Process

1. Rank findings by impersonation impact and delivery success rate
2. Document the spoofing method and evidence for each finding
3. Write remediation guidance (DMARC reject, DKIM for all sources, external banners)
4. Produce the final report with configuration change recommendations

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
