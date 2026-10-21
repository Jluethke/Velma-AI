# Linux Capabilities Abuse Test

Test for Linux capabilities abuse including cap_setuid and cap_dac_override on binaries.

## Inputs

- `suid-sgid-list`: SUID/SGID binaries for cross-reference
- `kernel-vuln-assessment`: Kernel vulnerability assessment

## Outputs

- `capabilities-findings`: Binaries with exploitable Linux capabilities
- `capability-escalation-paths`: Escalation paths through capabilities abuse

## Process

1. Run getcap -r / to find all binaries with file capabilities
2. Identify binaries with cap_setuid, cap_dac_override, or cap_sys_admin
3. Test whether each capable binary allows privilege escalation
4. Document the escalation chain for each exploitable capability

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
