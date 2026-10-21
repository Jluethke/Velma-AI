# Privesc Role Permission Map

Map all user roles and their associated permissions across the application and infrastructure.

## Inputs

- `application-access`: Access to the application with accounts at different privilege levels
- `scope-definition`: Which applications and infrastructure components are in scope

## Outputs

- `role-permission-matrix`: Matrix of roles to permissions across all application functions
- `admin-surface-map`: Map of all administrative functions and who can access them

## Process

1. Enumerate all defined roles and their documented permissions
2. Map each role to the actual API endpoints and functions it can access
3. Identify administrative functions and their access requirements
4. Document permission inheritance chains (group membership, role nesting)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
