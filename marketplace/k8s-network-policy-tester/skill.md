# K8S Network Policy Tester

Test network policies and verify network segmentation between pods and namespaces.

## Inputs

- `cluster-inventory`: Inventory of namespaces, pods, and services
- `cluster-access`: Cluster access credentials

## Outputs

- `network-policy-findings`: Missing or overly permissive network policies
- `network-reachability-map`: Which pods can communicate with which other pods

## Process

1. Enumerate all NetworkPolicy resources across namespaces
2. Identify namespaces with no network policies (default allow-all)
3. Test actual connectivity between pods in different namespaces
4. Verify that egress policies restrict outbound traffic to needed destinations only

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
