# Database Access Configurator

Configure authentication and access controls to enforce least privilege.

## Inputs

- `database-type`: Database product type
- `remaining-objects`: Current databases and accounts inventory

## Outputs

- `access-config`: Applied authentication and authorization settings
- `privilege-matrix`: Matrix of users, roles, and their granted privileges

## Process

1. Configure authentication to require passwords or certificate-based login
2. Create roles matching application requirements with minimum necessary privileges
3. Revoke unnecessary privileges from existing accounts
4. Restrict administrative access to named accounts only

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
