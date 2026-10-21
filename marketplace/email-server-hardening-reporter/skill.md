# Email Server Hardening Reporter

Produce the email server hardening report with all configuration changes and test results.

## Inputs

- `domain-name`: The email domain
- `dns-records`: Published DNS authentication records

## Outputs

- `hardening-report`: Full email server hardening report
- `compliance-summary`: Summary of SPF, DKIM, DMARC, and TLS compliance

## Process

1. Compile all configuration changes and test results
2. Run an external email security check (MXToolbox or equivalent)
3. Document any exceptions with justification
4. Produce the report with compliance status for each control

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
