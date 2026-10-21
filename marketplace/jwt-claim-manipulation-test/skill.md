# Jwt Claim Manipulation Test

Test for privilege escalation through claim manipulation in JWT payloads.

## Inputs

- `decoded-tokens`: Token payloads with role and permission claims
- `key-strength-results`: Whether signing keys were recovered

## Outputs

- `claim-manipulation-results`: Results of role and permission claim changes
- `escalation-evidence`: Proof of successful privilege escalation through claims

## Process

1. Modify role, permissions, or user_id claims and re-sign if key is known
2. Test for claim injection through nested JSON or array confusion
3. Check whether the server validates claims against a backend source of truth
4. Document any privilege escalation achieved through claim changes

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
