# Os Patch Hardening Checker

Check OS patch levels and hardening baselines across endpoints.

## Inputs

- `endpoint-inventory`: Inventory of endpoints to assess (workstations, servers, mobile)
- `hardening-baselines`: Expected hardening baselines (CIS, STIG, or custom)

## Outputs

- `patch-status-report`: Patch compliance status for each endpoint
- `hardening-deviations`: Deviations from the hardening baseline per endpoint

## Process

1. Scan endpoints for OS and application patch levels
2. Compare against the current patch baseline and identify missing critical and high patches
3. Audit hardening settings against the baseline (local policies, services, open ports)
4. Flag endpoints with critical deviations that increase attack surface

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
