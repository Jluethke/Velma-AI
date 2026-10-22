# Requirements Decomposition Allocator

Decompose system-level requirements to subsystem and component levels, maintaining parent-child traceability and identifying derived requirements.

## Inputs

- `requirements-set`: System-level requirements
- `architecture-description`: System architecture showing subsystems and components

## Outputs

- `decomposed-requirements`: Multi-level requirement tree from system through subsystem to component
- `derived-requirements-register`: Requirements that exist only because of design decisions, not directly traceable to stakeholder needs

## Process

1. For each system requirement, identify which subsystem(s) it applies to based on the architecture allocation. A requirement allocated to a single subsystem flows down directly. A requirement spanning multiple subsystems decomposes into coordinated sub-requirements.
2. For performance requirements spanning subsystems, apply budgeting: the system-level budget distributes across subsystems. Example: system latency of 100ms with three serial subsystems might allocate 30ms, 40ms, 30ms based on feasibility. Document the allocation rationale.
3. Identify derived requirements: requirements that arise from the design solution rather than from stakeholder needs. These include interface requirements between subsystems, environmental requirements from physical placement, and standards compliance requirements from the chosen technology. Tag each as derived and link to the design decision that created it.
4. Build the traceability matrix: rows are component requirements, columns are system requirements. Every component requirement must trace upward. System requirements with no downward trace are unallocated (gap). Component requirements with no upward trace are either derived (tag them) or orphaned (investigate).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
