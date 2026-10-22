# Resource Contention Resolver

Identify resource conflicts on the critical path. If the same person or resource is needed by two parallel tasks, one must wait. This extends the critical path and creates the critical chain (the critical path constrained by resource availability).

## Inputs

- `task-network`: The dependency graph with resource assignments
- `critical-path`: The initial critical path

## Outputs

- `critical-chain`: The resource-leveled critical path: the longest chain of tasks considering both dependencies and resource contention
- `resource-conflicts`: The specific conflicts resolved and the sequencing decisions made

## Process

1. For each resource, check if it is assigned to two or more tasks that are scheduled to run in parallel. If yes, one must be sequenced after the other.
2. Resolve the conflict by prioritizing the task on the critical path. The non-critical task waits. Recalculate the critical path after each resolution.
3. The result is the critical chain: the longest path considering both task dependencies and resource contention. This is longer than the original critical path if there were resource conflicts.
4. The critical chain is the true constraint. Everything else subordinates to it.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
