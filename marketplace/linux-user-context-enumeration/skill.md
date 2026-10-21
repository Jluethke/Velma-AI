# Linux User Context Enumeration

Enumerate the current user context, SUID binaries, and system configuration on a Linux host.

## Inputs

- `target-host`: Hostname or IP of the authorized Linux target
- `engagement-scope`: Written authorization and scope document

## Outputs

- `linux-user-context`: Current user, groups, and environment details
- `suid-sgid-list`: All SUID and SGID binaries on the system

## Process

1. Run id, groups, and env to document the current context
2. Find all SUID and SGID binaries with find / -perm -4000 and -2000
3. Enumerate kernel version, distribution, and installed packages
4. List all listening services and their running user accounts

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
