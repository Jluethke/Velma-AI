# Logmon Integrity Check

Check log integrity protections against tampering, deletion, and unauthorized access.

## Inputs

- `source-inventory`: Log source inventory
- `siem-access`: Access to logging infrastructure

## Outputs

- `integrity-findings`: Weaknesses in log integrity and tamper protection
- `access-control-findings`: Issues with who can read, modify, or delete logs

## Process

1. Check for write-once or append-only log storage configurations
2. Test whether logs can be modified or deleted by administrators
3. Verify log transmission encryption (TLS for syslog, HTTPS for API-based collection)
4. Check for tamper detection (hashing, blockchain-style chaining, digital signatures)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
