# K8S Control Plane Auditor

Audit the Kubernetes control plane configuration for security misconfigurations.

## Inputs

- `cluster-access`: Kubeconfig or access credentials for the cluster
- `cluster-version`: Kubernetes version and distribution (EKS, GKE, AKS, self-managed)
- `audit-scope`: Which namespaces and components are in scope

## Outputs

- `control-plane-findings`: Misconfigurations in API server, etcd, scheduler, and controller manager
- `cluster-inventory`: Inventory of namespaces, nodes, pods, and services

## Process

1. Check API server flags (anonymous auth, RBAC mode, audit logging, admission controllers)
2. Verify etcd encryption at rest and access controls
3. Check scheduler and controller manager for insecure settings
4. Compare against CIS Kubernetes Benchmark

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
