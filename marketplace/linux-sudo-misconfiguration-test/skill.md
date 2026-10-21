# Linux Sudo Misconfiguration Test

Check for sudo misconfigurations including NOPASSWD entries and GTFOBins-exploitable commands.

## Inputs

- `linux-user-context`: Current user and group memberships
- `suid-sgid-list`: SUID/SGID binary inventory

## Outputs

- `sudo-findings`: Sudo misconfigurations and exploitable entries
- `gtfobins-matches`: Sudo-allowed commands with known escalation techniques

## Process

1. Parse sudo -l output for the current user
2. Cross-reference allowed commands against GTFOBins techniques
3. Check for wildcards and path traversal in sudoers entries
4. Test for sudo version vulnerabilities (CVE-2021-3156 and similar)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
