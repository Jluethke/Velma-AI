# Resilience Failover Security Checker

Check that resilience and failover mechanisms do not weaken security posture.

## Inputs

- `component-inventory`: System component inventory
- `segmentation-findings`: Network segmentation findings

## Outputs

- `resilience-security-findings`: Security issues in resilience and failover paths
- `failover-exposure-map`: Map of security controls that degrade during failover

## Process

1. Identify all failover and redundancy mechanisms
2. Check whether failover paths bypass security controls present in normal operation
3. Verify that backup systems maintain the same security configuration as primary
4. Test that degraded-mode operation does not expose new attack surfaces

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
