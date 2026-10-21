# System Architecture Documenter

Document the target system architecture, components, data flows, and external interfaces.

## Inputs

- `system-name`: Name of the system under analysis
- `architecture-sources`: Diagrams, docs, or code repos describing the system
- `scope-boundaries`: What is in and out of scope for this session

## Outputs

- `architecture-diagram`: Component and data flow diagram
- `data-flow-inventory`: Catalog of all data flows with classification
- `external-interfaces`: List of all external connections and protocols

## Process

1. Inventory all system components, services, and data stores
2. Map data flows between components including protocols and authentication
3. Identify all external interfaces, APIs, and user-facing surfaces
4. Document the technology stack for each component

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
