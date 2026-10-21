# Rto Rpo Measurement

Measure actual recovery time and recovery point against documented objectives.

## Inputs

- `restoration-test-results`: Results from restoration tests
- `backup-policies`: Documented RTO and RPO targets

## Outputs

- `rto-rpo-comparison`: Comparison of actual recovery metrics against targets
- `objective-gaps`: Systems where actual recovery exceeds stated RTO or RPO

## Process

1. Calculate actual RTO from the restoration tests (time from failure to operational)
2. Calculate actual RPO from backup timestamps (data loss window)
3. Compare each system's actual metrics against its documented RTO and RPO targets
4. Flag systems where actual recovery exceeds targets by any amount

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
