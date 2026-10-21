# Ad Privilege Analyzer

Identify over-privileged accounts and dangerous group memberships.

## Inputs

- `account-inventory`: All accounts and groups
- `domain-structure`: Domain and OU structure

## Outputs

- `privilege-findings`: Over-privileged accounts, nested group escalation paths, and stale admin accounts
- `attack-path-map`: Paths from low-privilege accounts to domain admin

## Process

1. Enumerate members of Domain Admins, Enterprise Admins, Schema Admins, and all privileged groups
2. Trace nested group memberships to find hidden privilege paths
3. Identify accounts with AdminCount=1 that are not in privileged groups (orphaned admin SDProp)
4. Map attack paths from standard user to domain admin using ACL analysis

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
