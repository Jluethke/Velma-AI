# Scope Escalation Tester

Test for scope escalation by requesting or manipulating token scopes.

## Inputs

- `flow-inventory`: OAuth flow inventory
- `token-storage-findings`: Token storage findings for context

## Outputs

- `scope-escalation-results`: Results of scope escalation tests
- `consent-bypass-findings`: Any methods to bypass consent for additional scopes

## Process

1. Request tokens with scopes beyond what the client is registered for
2. Test whether token exchange endpoints allow scope escalation
3. Check whether consent can be bypassed by replaying or modifying authorization responses
4. Verify that the resource server validates scopes on each API call, not just at token issuance

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
