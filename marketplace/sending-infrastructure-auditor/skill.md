# Sending Infrastructure Auditor

Audit the email sending infrastructure including authentication records and IP reputation.

## Inputs

- `sending-domain`: The domain used for sending email
- `sending-platform`: The email service provider or SMTP infrastructure

## Outputs

- `infrastructure-audit`: Status of SPF, DKIM, DMARC, IP reputation, and sending domain health
- `infrastructure-fixes`: List of issues found and recommended fixes

## Process

1. Check SPF record for correctness and alignment.
2. Check DKIM signing and key rotation status.
3. Check DMARC policy and reporting configuration.
4. Assess IP reputation using blacklist checks and sender score.
5. Document all findings and fixes needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
