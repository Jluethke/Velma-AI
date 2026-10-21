# Service Mesh Mapper

Map all microservices and their communication patterns.

## Inputs

- `service-registry`: Service registry or discovery system configuration
- `network-policies`: Network policies and firewall rules between services

## Outputs

- `service-topology`: Map of all services and their dependencies
- `communication-matrix`: Matrix showing which service calls which, over what protocol

## Process

1. Query the service registry for all registered services and their endpoints
2. Trace actual communication patterns from network logs or service mesh telemetry
3. Identify services communicating outside the expected patterns
4. Document protocols in use (gRPC, HTTP, AMQP, raw TCP) for each service pair

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
