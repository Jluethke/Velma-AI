# Edr Coverage Tester

Test endpoint detection and response (EDR) deployment and detection effectiveness.

## Inputs

- `endpoint-inventory`: Endpoint inventory
- `patch-status-report`: Patch status for correlation

## Outputs

- `edr-coverage-results`: EDR deployment coverage and detection test results
- `edr-gaps`: Endpoints without EDR or with misconfigured EDR

## Process

1. Verify EDR agent deployment: which endpoints have it installed, running, and reporting
2. Test detection by executing known-bad indicators (safe test malware, EICAR, atomic red team tests)
3. Check whether EDR is configured in detect-only or prevent mode
4. Identify endpoints where EDR is absent, disabled, or running an outdated version

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
