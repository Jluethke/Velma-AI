# Privesc Horizontal Test

Test for horizontal privilege escalation where one user can access another user's data or actions at the same privilege level.

## Inputs

- `role-permission-matrix`: Map of roles and permissions
- `application-access`: Test accounts at the same privilege level

## Outputs

- `horizontal-findings`: Instances where one user can access another's data or functions
- `data-isolation-assessment`: Assessment of tenant and user data isolation

## Process

1. Test accessing resources belonging to another user at the same privilege level
2. Swap user identifiers in API requests (user IDs, account numbers, object references)
3. Check for predictable or enumerable resource identifiers
4. Test multi-tenant isolation boundaries

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
