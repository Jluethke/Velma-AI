# Service Activation Tester

Activate the service and test end-to-end connectivity.

## Inputs

- `configuration-record`: Network configurations applied
- `activation-checklist`: Activation checklist

## Outputs

- `test-results`: End-to-end test results (connectivity, bandwidth, latency, packet loss)
- `activation-status`: Service activation status (active, pending remediation)

## Process

1. Activate the service on the configured network elements.
2. Run end-to-end connectivity tests from the customer premises.
3. Validate bandwidth, latency, and packet loss against the SLA.
4. Resolve any issues found during testing before handoff.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
