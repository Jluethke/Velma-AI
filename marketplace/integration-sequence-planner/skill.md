# Integration Sequence Planner

Plan the integration sequence by analyzing interface dependencies and defining incremental build milestones.

## Inputs

- `interface-catalog`: All system interfaces with maturity scores and criticality
- `component-delivery-schedule`: When each component is available for integration

## Outputs

- `integration-sequence`: Ordered sequence of integration builds with components added at each build and interfaces exercised
- `integration-risk-register`: Risks per build: immature interfaces, component delays, test coverage gaps

## Process

1. Build the interface dependency graph: nodes are components, edges are interfaces. Identify the critical path through the graph: the longest chain of dependent integrations that determines the minimum integration duration.
2. Define integration builds. Each build adds one or more components to the integrated set. Sequence builds so that: (1) components with the most interfaces are integrated first (they drive the most defect discovery), (2) high-risk interfaces are exercised early (fail fast), (3) component availability is respected.
3. For each build, define the scope: which interfaces are exercised for the first time, which are regression-tested, what test environment configuration is needed. Assign a build coordinator responsible for the build's entry/exit criteria.
4. Identify integration risks: interfaces with maturity below 3 (poorly documented), components expected to arrive late, interfaces that cross organizational boundaries (ICD disagreements likely). For each risk, define a mitigation: early interface simulation, schedule buffer, interface working group.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
