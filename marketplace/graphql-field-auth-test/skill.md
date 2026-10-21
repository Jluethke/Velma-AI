# Graphql Field Auth Test

Test field-level authorization to check whether users can access data beyond their role.

## Inputs

- `batch-abuse-results`: Batch abuse results
- `sensitive-fields`: Sensitive fields to test

## Outputs

- `auth-bypass-findings`: Fields accessible beyond authorized role
- `idor-findings`: Object-level authorization failures

## Process

1. Query sensitive fields with different authentication levels
2. Test for IDOR by requesting other users' data through ID manipulation
3. Check mutation authorization for privilege escalation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
