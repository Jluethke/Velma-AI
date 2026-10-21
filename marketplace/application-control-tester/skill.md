# Application Control Tester

Test application whitelisting and execution control policies.

## Inputs

- `endpoint-inventory`: Endpoint inventory
- `edr-coverage-results`: EDR results for correlation

## Outputs

- `app-control-results`: Results of application control bypass testing
- `execution-policy-gaps`: Gaps in execution control that allow unauthorized software

## Process

1. Test whether unsigned or unapproved executables can run
2. Attempt bypass techniques: DLL sideloading, script interpreters, LOLBins (living off the land)
3. Check PowerShell and script execution policies and constrained language mode
4. Test whether macro execution is controlled in Office applications

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
