# Trust Boundary Mapper

Document all system components and map trust boundaries between them.

## Inputs

- `system-description`: Description of the system under review
- `architecture-diagrams`: Available architecture diagrams or topology docs

## Outputs

- `component-inventory`: Cataloged list of all system components
- `trust-boundary-map`: Map showing trust boundaries between components

## Process

1. Enumerate all system components including services, databases, message queues, and external integrations
2. Identify trust boundaries at network, process, and data layers
3. Map data flows that cross each trust boundary
4. Document assumptions about trust at each boundary

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
