# Certificate Rotation Tester

Test certificate rotation without downtime to verify the renewal pipeline works end to end.

## Inputs

- `automation-configuration`: Renewal automation setup
- `monitoring-configuration`: Monitoring rules to verify success

## Outputs

- `rotation-test-results`: Results of rotation tests with downtime measurements
- `rotation-issues`: Any failures or service interruptions during testing

## Process

1. Trigger a renewal cycle for a test certificate
2. Monitor for service interruption during the rotation
3. Verify the new certificate is served correctly (chain, SAN, expiration)
4. Document any issues and their root causes

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
