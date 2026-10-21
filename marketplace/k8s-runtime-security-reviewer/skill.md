# K8S Runtime Security Reviewer

Review runtime security controls including seccomp, AppArmor, and container image policies.

## Inputs

- `pod-security-findings`: Pod security configuration findings
- `cluster-inventory`: Inventory of pods and images

## Outputs

- `runtime-security-findings`: Missing or weak runtime security controls
- `image-policy-status`: Whether image signing and scanning are enforced

## Process

1. Check for seccomp profiles applied to pods
2. Check for AppArmor or SELinux profiles on containers
3. Verify that image pull policies prevent use of unsigned or unscanned images
4. Check for runtime monitoring tools and their coverage

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
