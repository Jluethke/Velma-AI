# Cis Benchmark Selector

Select the appropriate CIS benchmark or STIG profile for the target Windows Server version and role.

## Inputs

- `server-version`: Windows Server version and edition
- `server-role`: Primary role of the server (domain controller, file server, web server, etc.)

## Outputs

- `benchmark-profile`: Selected CIS or STIG benchmark profile with version
- `baseline-scan`: Current compliance state against the selected benchmark

## Process

1. Identify the Windows Server version and installed roles
2. Select the matching CIS benchmark or STIG profile
3. Run a baseline compliance scan and record the starting score

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
