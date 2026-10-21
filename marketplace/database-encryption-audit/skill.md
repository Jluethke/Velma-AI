# Database Encryption Audit

Audit database encryption for data at rest (TDE, filesystem encryption) and data in transit (TLS connections).

## Inputs

- `database-inventory`: Database instances to audit
- `credential-findings`: Credential audit results

## Outputs

- `encryption-findings`: Encryption gaps and misconfigurations
- `tls-configuration`: TLS version, cipher suites, and certificate status per instance

## Process

1. Check whether transparent data encryption (TDE) is enabled for databases containing sensitive data.
2. Verify TLS is required for all client connections (reject plaintext).
3. Check TLS configuration for weak protocol versions (TLS 1.0, 1.1) and cipher suites.
4. Verify that database backups are encrypted.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
