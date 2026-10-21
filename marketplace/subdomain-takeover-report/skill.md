# Subdomain Takeover Report

Compile subdomain takeover assessment findings into a prioritized report.

## Inputs

- `takeover-candidates`: Confirmed takeover candidates
- `ns-takeover-results`: NS delegation findings
- `expired-domain-findings`: Expired domain findings

## Outputs

- `takeover-report`: Prioritized subdomain takeover assessment report
- `takeover-remediation-guide`: Remediation for each takeover risk

## Process

1. Rank findings by impact (NS takeover > CNAME to expired domain > service takeover)
2. Document the claim process and proof-of-concept for each finding
3. Write remediation guidance (remove dangling records, claim services, monitor DNS)
4. Produce the final report with severity ratings and timeline

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
