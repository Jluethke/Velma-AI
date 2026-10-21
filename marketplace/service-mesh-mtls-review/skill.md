# Service Mesh Mtls Review

Review the service mesh configuration and verify mTLS enforcement between all services.

## Inputs

- `cluster-access`: Access to the Kubernetes cluster or cloud environment
- `architecture-diagram`: Service architecture and communication flow diagram

## Outputs

- `mtls-findings`: Services or paths where mTLS is not enforced
- `mesh-config-map`: Service mesh policies and their enforcement status

## Process

1. Inventory the service mesh (Istio, Linkerd, Consul Connect) and its configuration
2. Check that mTLS is in STRICT mode (not PERMISSIVE) for all namespaces
3. Identify services that bypass the mesh (hostNetwork, excluded ports)
4. Test whether plaintext connections between services are rejected

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
