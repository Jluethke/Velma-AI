# Security Observability Check

Check that security-relevant events are collected, correlated, and alerted on in the cloud-native stack.

## Inputs

- `cluster-access`: Access to the cluster and monitoring tools
- `service-auth-findings`: Service auth findings for alert coverage testing

## Outputs

- `observability-findings`: Gaps in security event collection and alerting
- `detection-coverage-map`: Map of attack types to detection capabilities

## Process

1. Check that Kubernetes audit logs, pod events, and network flows are collected
2. Verify that Falco, Sysdig, or equivalent runtime security monitoring is deployed
3. Test whether known attack patterns (container escape, privilege escalation) trigger alerts
4. Review alert routing and on-call integration for security events

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
