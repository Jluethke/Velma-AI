# Zero Downtime Rotation Tester

Test that automated rotation works without service interruption.

## Inputs

- `automation-scripts`: Rotation automation implementations
- `dependency-map`: Map of services consuming each secret

## Outputs

- `rotation-test-results`: Results of rotation tests including service availability during rotation
- `failure-scenarios`: Identified failure scenarios and their mitigations

## Process

1. Trigger rotation for each secret type in a staging environment.
2. Monitor all dependent services for errors or downtime during and after rotation.
3. Test failure scenarios: what happens if a rotation fails mid-way, if a consumer misses the update.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
