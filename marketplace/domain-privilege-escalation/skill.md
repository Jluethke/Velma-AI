# Domain Privilege Escalation

Attempt to escalate privileges to domain administrator or equivalent.

## Inputs

- `compromised-hosts-log`: Hosts accessed during lateral movement
- `captured-credentials`: All credentials obtained so far

## Outputs

- `escalation-path-report`: Detailed path from initial access to domain admin
- `domain-admin-evidence`: Proof of domain administrator access if achieved

## Process

1. Enumerate Active Directory for privilege escalation paths
2. Test for unconstrained delegation and DCSync opportunities
3. Attempt to extract credentials from domain controller memory or NTDS.dit
4. Document the complete escalation path with timestamps and evidence

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
