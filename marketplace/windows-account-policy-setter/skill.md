# Windows Account Policy Setter

Configure account policies for password complexity, lockout thresholds, and privilege management.

## Inputs

- `benchmark-profile`: CIS or STIG benchmark with account policy requirements
- `baseline-scan`: Current account policy settings

## Outputs

- `account-policy-config`: Applied account policy settings
- `policy-change-log`: Record of each policy change with before and after values

## Process

1. Set password complexity requirements (length, character types, history)
2. Configure account lockout thresholds and duration
3. Review and restrict local administrator group membership
4. Configure user rights assignments per the benchmark

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
