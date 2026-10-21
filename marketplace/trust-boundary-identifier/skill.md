# Trust Boundary Identifier

Identify and document trust boundaries within the system architecture.

## Inputs

- `architecture-diagram`: Component and data flow diagram
- `data-flow-inventory`: Catalog of all data flows
- `external-interfaces`: List of external connections

## Outputs

- `trust-boundary-map`: Diagram with trust boundaries marked
- `boundary-crossing-inventory`: All data flows that cross trust boundaries
- `privilege-level-map`: Privilege levels on each side of each boundary

## Process

1. Identify network boundaries (public internet, DMZ, internal, database tier)
2. Identify process boundaries (user space, kernel, container, VM)
3. Identify privilege transitions (anonymous to authenticated, user to admin)
4. Document each data flow that crosses a trust boundary

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
