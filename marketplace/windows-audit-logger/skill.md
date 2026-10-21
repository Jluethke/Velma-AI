# Windows Audit Logger

Configure Windows audit logging to capture security-relevant events.

## Inputs

- `benchmark-profile`: CIS or STIG benchmark with audit policy requirements
- `server-role`: Server role to determine role-specific audit categories

## Outputs

- `audit-policy-config`: Applied audit policy settings by category
- `log-retention-config`: Event log size and retention settings

## Process

1. Configure advanced audit policies for logon events, object access, and privilege use
2. Set event log maximum sizes and retention method
3. Configure Sysmon or Windows Event Forwarding if applicable
4. Verify events are being generated for test actions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
