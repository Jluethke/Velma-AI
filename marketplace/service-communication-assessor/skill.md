# Service Communication Assessor

Assess current microservices communication patterns to inform service mesh requirements.

## Inputs

- `service-catalog`: List of microservices and their roles
- `network-topology`: Current network architecture and communication paths

## Outputs

- `communication-map`: Map of all service-to-service communication
- `mesh-requirements`: Requirements for the service mesh

## Process

1. Map all service-to-service communication patterns
2. Identify current authentication and encryption between services
3. Document traffic volumes and latency requirements per link
4. Define the mesh requirements (security, observability, traffic management)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
