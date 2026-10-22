# Mesh Platform Selector

Select the service mesh platform based on requirements, Kubernetes version, and operational complexity.

## Inputs

- `mesh-requirements`: Requirements for the service mesh
- `infrastructure-context`: Kubernetes version, cloud provider, team skills

## Outputs

- `selected-mesh`: The chosen service mesh platform
- `deployment-plan`: Plan for deploying the mesh incrementally

## Process

1. Evaluate Istio, Linkerd, and Consul Connect against requirements
2. Consider operational complexity and resource overhead
3. Select the mesh and plan an incremental rollout
4. Define the rollout phases (non-critical services first)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
