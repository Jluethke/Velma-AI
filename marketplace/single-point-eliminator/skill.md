# Single Point Eliminator

Systematically eliminate single points of failure. Every critical path must have at least two ways through.

## Inputs

- `fragility-assessment`: The full system assessment
- `system-description`: The system context

## Outputs

- `single-point-inventory`: Every single point of failure in the system with the affected function and the failure consequence
- `redundancy-plan`: For each single point: the redundancy to build, the cost, and the timeline

## Process

1. For each component, ask: if this fails, does the entire system stop? If yes, it is a single point of failure.
2. Map the redundancy options: a second person who can do the job, a second system that can take over, a second vendor who can supply, a second income source that can cover obligations.
3. Prioritize by consequence severity and cost of redundancy. Build the cheapest, highest-impact redundancies first.
4. Accept that some single points cannot be eliminated (your own health). For those, maximize the compensating controls (insurance, documented procedures, trained alternates).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
