# Win Token Impersonation Test

Test for token impersonation and potato-style escalation using SeImpersonatePrivilege.

## Inputs

- `user-context-report`: Current user privileges including SeImpersonate
- `task-escalation-findings`: Scheduled task findings for combined attack paths

## Outputs

- `token-impersonation-results`: Results of token impersonation attempts
- `escalation-proof`: Proof-of-concept evidence of successful escalation

## Process

1. Check whether SeImpersonatePrivilege or SeAssignPrimaryTokenPrivilege is held
2. Test named pipe impersonation and relay techniques
3. Attempt SYSTEM token capture from a privileged service
4. Document the escalation chain with timestamps and evidence

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
