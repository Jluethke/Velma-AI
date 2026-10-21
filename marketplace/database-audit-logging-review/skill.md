# Database Audit Logging Review

Review database audit logging configuration for completeness, covering DDL, DML, authentication events, and privilege changes.

## Inputs

- `database-inventory`: Database instances to review
- `encryption-findings`: Encryption audit results

## Outputs

- `audit-logging-findings`: Logging gaps and configuration issues
- `log-retention-status`: Log storage locations and retention periods

## Process

1. Check whether audit logging is enabled and capturing DDL statements.
2. Verify that authentication successes and failures are logged.
3. Check that privilege escalation and role changes trigger audit events.
4. Verify that audit logs are stored externally (not only on the database server) and have adequate retention.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
