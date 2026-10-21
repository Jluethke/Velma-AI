# Win User Context Enumeration

Enumerate the current user context, group memberships, and assigned privileges on a Windows host.

## Inputs

- `target-host`: Hostname or IP of the authorized Windows target
- `engagement-scope`: Written authorization and scope document

## Outputs

- `user-context-report`: Current user, groups, and privileges enumeration
- `installed-software-list`: List of installed software and versions

## Process

1. Run whoami /all to list user SID, groups, and privileges
2. Enumerate installed software and patch levels with systeminfo and wmic
3. List running services and their startup accounts
4. Document the current access level as the escalation baseline

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
