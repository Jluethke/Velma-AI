# Dns Hardening Reporter

Produce the DNS server hardening report with all changes and compliance status.

## Inputs

- `dns-software`: DNS server software
- `dnssec-config`: DNSSEC configuration

## Outputs

- `hardening-report`: Full DNS server hardening report
- `dnssec-validation-status`: DNSSEC validation status from external check

## Process

1. Compile all configuration changes and test results
2. Run an external DNS security assessment
3. Document any exceptions with justification
4. Produce the report with compliance status for each control

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
