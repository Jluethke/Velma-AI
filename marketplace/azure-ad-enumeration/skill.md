# Azure Ad Enumeration

Enumerate Azure Active Directory objects including users, groups, roles, and service principals.

## Inputs

- `tenant-id`: Azure tenant identifier
- `authorization-scope`: Written scope of the authorized test
- `credential-set`: Initial test credentials or tokens

## Outputs

- `ad-object-inventory`: Enumerated users, groups, roles, and service principals
- `role-assignment-map`: Map of RBAC role assignments across the tenant

## Process

1. Authenticate with provided credentials and enumerate tenant information
2. List all users, groups, and service principals with their properties
3. Map RBAC role assignments at subscription, resource group, and resource levels
4. Identify privileged accounts and service principals with excessive permissions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
