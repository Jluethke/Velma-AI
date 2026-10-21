# Linux Auditd Configurator

Configure auditd rules to monitor security-relevant system activity.

## Inputs

- `benchmark-profile`: CIS benchmark with audit requirements
- `server-role`: Server role for role-specific audit rules

## Outputs

- `audit-rules`: Applied auditd rules file
- `audit-config`: Auditd daemon configuration (log size, retention)

## Process

1. Install and enable auditd if not already present
2. Configure rules for file access, privilege escalation, and authentication events
3. Set log rotation and retention policies
4. Verify that audit events are being captured for test actions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
