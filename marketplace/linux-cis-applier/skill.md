# Linux Cis Applier

Select and apply the CIS benchmark profile for the target Linux distribution and version.

## Inputs

- `distribution`: Linux distribution name and version
- `server-role`: Primary role (web server, database, application, etc.)

## Outputs

- `benchmark-profile`: Selected CIS benchmark profile
- `baseline-scan`: Current compliance state before hardening

## Process

1. Identify the Linux distribution and version
2. Select the matching CIS benchmark profile (Level 1 or Level 2)
3. Run a baseline compliance scan using a tool like OpenSCAP or Lynis

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
