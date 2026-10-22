# Email Authentication Auditor

Audit DNS authentication records (SPF, DKIM, DMARC).

## Inputs

- `sending-domain`: The domain used for sending emails
- `email-service-provider`: The ESP or sending infrastructure in use

## Outputs

- `auth-audit-results`: Current state of SPF, DKIM, and DMARC records with pass/fail status
- `auth-fix-list`: List of DNS changes needed to fix authentication issues

## Process

1. Query the SPF record and verify it includes the ESP's sending IPs. Check for the 10-lookup limit.
2. Query the DKIM record and verify the public key matches the ESP configuration.
3. Query the DMARC record and verify the policy (none, quarantine, reject) and reporting addresses.
4. List every fix needed with the exact DNS record to add or change.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
