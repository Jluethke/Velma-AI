# Interface Identification And Mapping

Identify all interfaces from the system architecture, classify them by type, and assign ownership for each boundary.

## Inputs

- `system-architecture`: Block diagram showing all subsystems, external systems, operators, and environment
- `requirements-set`: System and subsystem requirements that involve interactions across boundaries

## Outputs

- `interface-register`: Every interface identified with unique ID, the two entities it connects, interface type (electrical, mechanical, data, thermal, optical, RF, fluid, human), and the owning organization for each side
- `interface-priority-ranking`: Interfaces ranked by risk: high risk for cross-organization, safety-critical, or novel interfaces; low risk for standard, single-organization, well-characterized interfaces
- `n-squared-diagram`: N-squared chart showing all entity-to-entity interactions, with each cell containing the interface ID and type

## Process

1. Draw the N-squared diagram: list all subsystems and external entities along both axes. Each cell (i,j) contains the outputs from entity i to entity j. Each cell (j,i) contains the outputs from entity j to entity i. Every non-empty cell is an interface to document.
2. Classify each interface by type. Most physical interfaces have multiple types simultaneously: a connector interface is mechanical (form factor, mounting), electrical (pin assignments, voltage levels), and environmental (sealing, temperature). List each type that applies.
3. Assign ownership. Each side of the interface has an owner responsible for meeting the ICD specification at their boundary. For cross-organization interfaces, assign a single interface manager responsible for the ICD document itself, distinct from the owners of each side.
4. Rank interfaces by risk. Cross-organization interfaces are highest risk because changes require negotiation and each side may have different verification equipment. Safety-critical interfaces where a failure causes a hazard are next. Novel or first-time interfaces with no heritage data follow. Standard interfaces with proven heritage are lowest risk.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
