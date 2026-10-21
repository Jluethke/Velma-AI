# Legacy Bypass Path Finder

Find legacy systems and configurations that bypass zero trust controls.

## Inputs

- `implicit-trust-findings`: Implicit trust assumptions
- `access-flow-map`: All access flows

## Outputs

- `legacy-bypass-findings`: Legacy systems, protocols, and configurations that bypass zero trust
- `migration-priority-list`: Priority order for migrating or isolating legacy bypasses

## Process

1. Identify systems using legacy protocols that cannot participate in zero trust (NTLM, telnet, FTP)
2. Find VPN or remote access paths that grant broad network access
3. Check for firewall rules that pre-date the zero trust implementation and are still active
4. Prioritize each bypass by the sensitivity of the resources it exposes

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
