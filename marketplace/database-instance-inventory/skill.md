# Database Instance Inventory

Inventory all database instances, versions, and their network exposure across the environment.

## Inputs

- `environment-scope`: Network ranges and cloud accounts to inventory
- `database-types`: Database technologies in use (MySQL, PostgreSQL, MongoDB, etc.)

## Outputs

- `database-inventory`: All database instances with version, location, and network exposure
- `patch-status`: Patch level relative to current stable releases

## Process

1. Discover database instances through network scanning, cloud APIs, and configuration management.
2. Record the version, edition, and patch level of each instance.
3. Determine network exposure (internet-facing, internal-only, VPN-accessible).
4. Identify instances running end-of-life or unpatched versions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
