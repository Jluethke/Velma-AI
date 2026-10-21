# Database Audit Logger

Configure database audit logging to capture access and modification events.

## Inputs

- `database-type`: Database product type
- `privilege-matrix`: User and role privileges to determine what to audit

## Outputs

- `audit-config`: Applied audit logging configuration
- `audit-test-results`: Verification that audit events are being captured

## Process

1. Enable audit logging for login events (success and failure)
2. Configure auditing for DDL operations (CREATE, ALTER, DROP)
3. Configure auditing for privileged operations (GRANT, REVOKE)
4. Set log rotation and retention to meet compliance requirements

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
