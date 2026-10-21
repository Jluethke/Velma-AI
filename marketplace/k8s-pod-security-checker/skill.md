# K8S Pod Security Checker

Check pod security standards, admission controllers, and container configurations.

## Inputs

- `cluster-inventory`: Inventory of pods and deployments
- `control-plane-findings`: API server and admission controller status

## Outputs

- `pod-security-findings`: Pods running as root, with host access, or without security context
- `admission-controller-status`: Which admission controllers are active and their policies

## Process

1. Check for pods running as root or with privileged containers
2. Identify pods with hostNetwork, hostPID, hostIPC, or host path mounts
3. Verify Pod Security Standards enforcement (baseline, restricted)
4. Check for missing security contexts (readOnlyRootFilesystem, capabilities drop)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
