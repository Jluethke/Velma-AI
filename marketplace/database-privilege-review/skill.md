# Database Privilege Review

Review user privileges across all database instances for least privilege violations and excessive grants.

## Inputs

- `database-inventory`: Database instances to review
- `auth-control-findings`: Authentication audit results

## Outputs

- `privilege-findings`: Excessive privileges and least-privilege violations
- `role-hierarchy-map`: Map of roles, grants, and privilege inheritance

## Process

1. List all database users, roles, and their granted privileges.
2. Identify users with DBA or superuser privileges who do not need them.
3. Check for application accounts with excessive privileges (DROP, GRANT, ALTER).
4. Verify that privilege grants follow role-based access control patterns.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
