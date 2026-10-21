# Privesc Vertical Test

Test for vertical privilege escalation where a lower-privilege user can gain administrative or higher-privilege access.

## Inputs

- `role-permission-matrix`: Map of roles and permissions
- `admin-surface-map`: Map of administrative functions

## Outputs

- `vertical-findings`: Paths from lower to higher privilege levels
- `admin-bypass-findings`: Administrative functions accessible without proper authorization

## Process

1. Access administrative endpoints with lower-privilege credentials
2. Test for role parameter manipulation in requests
3. Check for self-service role elevation mechanisms
4. Test forced browsing to administrative URLs and API endpoints

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
