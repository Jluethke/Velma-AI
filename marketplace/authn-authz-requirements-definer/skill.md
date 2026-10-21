# Authn Authz Requirements Definer

Define authentication and authorization requirements for all system access points.

## Inputs

- `system-description`: Description of the system including user roles and access points
- `threat-requirements`: Security requirements derived from threats

## Outputs

- `authn-requirements`: Authentication requirements (MFA, password policy, session management)
- `authz-requirements`: Authorization requirements (RBAC, ABAC, least privilege, API scopes)

## Process

1. List all access points (UI, API, admin console, service-to-service) and their user roles.
2. Define authentication strength requirements per access point and risk level.
3. Define authorization rules: role definitions, permission matrices, and least privilege enforcement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
