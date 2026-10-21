# Email Encryption Transit Check

Check email encryption in transit including STARTTLS enforcement and MTA-STS configuration.

## Inputs

- `email-system-info`: MX hosts and SMTP servers
- `target-domains`: Domains to check

## Outputs

- `encryption-findings`: STARTTLS, MTA-STS, and DANE configuration status
- `downgrade-risk`: Assessment of susceptibility to encryption downgrade attacks

## Process

1. Test STARTTLS support and certificate validity on each MX host
2. Check for MTA-STS policy publication and enforcement mode
3. Check for DANE TLSA records
4. Test whether connections fall back to plaintext if STARTTLS fails

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
