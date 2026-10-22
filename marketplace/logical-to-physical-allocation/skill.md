# Logical To Physical Allocation

Allocate logical functions to physical components, resolving many-to-many mappings and documenting allocation rationale.

## Inputs

- `functional-architecture`: Function hierarchy with flows
- `physical-architecture-candidates`: Candidate physical components and their capabilities

## Outputs

- `allocation-matrix`: Function-to-component allocation with rationale for each assignment
- `interface-block-diagrams`: IBDs showing physical component connections with flow types and protocols

## Process

1. Build an allocation matrix with functions as rows and physical components as columns. For each cell, mark allocated, partially allocated, or not allocated. A function split across multiple components requires an interface between them.
2. For each allocation decision, record the rationale: why this function belongs on this component. Common reasons: processing capacity, physical proximity to sensors/actuators, safety isolation, reuse of existing capability.
3. For functions allocated across multiple components, define the interface: data exchanged, protocol, latency requirement, and failure mode if the interface breaks.
4. Build IBDs showing the physical architecture with internal block structure. Ports represent physical interfaces (connectors, buses, wireless links). Flows through ports are typed by the data/energy/material they carry.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
