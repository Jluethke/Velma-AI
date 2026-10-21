# Win Service Path Audit

Check for unquoted service paths and writable service directories that allow binary planting.

## Inputs

- `user-context-report`: Current user context and privileges
- `installed-software-list`: Software and service inventory

## Outputs

- `service-path-findings`: List of vulnerable service paths and writable directories
- `service-permissions-map`: Map of service binary permissions by account

## Process

1. Query all services for unquoted image paths containing spaces
2. Check write permissions on each directory in the unquoted path
3. Identify services running as SYSTEM or high-privilege accounts
4. Rank findings by exploitability and privilege gained

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
