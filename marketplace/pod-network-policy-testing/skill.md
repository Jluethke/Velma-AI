# Pod Network Policy Testing

Test Kubernetes network policies for proper pod-to-pod isolation and egress restrictions.

## Inputs

- `rbac-findings`: RBAC audit results
- `image-list`: Deployed image inventory

## Outputs

- `network-policy-findings`: Missing or ineffective network policies
- `pod-connectivity-map`: Actual pod-to-pod connectivity matrix

## Process

1. List all NetworkPolicy resources and their rules.
2. Identify namespaces and pods with no network policies (default allow-all).
3. Test actual connectivity between pods to verify policy enforcement.
4. Check egress policies to confirm pods cannot reach unintended external services.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
