# Privesc Permission Chain Review

Review permission inheritance chains and delegation paths for unintended privilege accumulation.

## Inputs

- `role-permission-matrix`: Full role and permission matrix
- `token-elevation-findings`: Token elevation findings

## Outputs

- `inheritance-findings`: Unintended privilege paths through permission inheritance
- `delegation-findings`: Risky permission delegation patterns

## Process

1. Trace permission inheritance from group membership through nested roles
2. Identify permissions that accumulate through multiple group memberships
3. Check for delegation chains that bypass normal authorization (service accounts, API keys)
4. Test for permission persistence after role revocation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
