# Email Relay Test

Test mail servers for open relay vulnerabilities that would allow unauthorized email sending.

## Inputs

- `email-system-info`: MX hosts and SMTP server addresses
- `target-domains`: In-scope domains

## Outputs

- `relay-findings`: Open relay test results for each mail server
- `smtp-config-findings`: SMTP configuration weaknesses found

## Process

1. Attempt relay through each MX host with external sender and recipient addresses
2. Test SMTP VRFY and EXPN commands for information disclosure
3. Check for authenticated relay misconfigurations
4. Test SMTP banner information disclosure

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
