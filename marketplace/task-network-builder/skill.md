# Task Network Builder

Build the task network: every task, its dependencies, its duration estimate, and its resource requirements.

## Inputs

- `initiative-description`: What the project or initiative delivers
- `task-list`: All tasks with duration estimates, dependencies, and resource assignments

## Outputs

- `task-network`: The dependency graph: tasks as nodes, dependencies as edges, with duration and resource for each task
- `critical-path`: The longest path through the network (the sequence that determines the project duration)

## Process

1. List every task with its estimated duration. For each, identify the predecessor tasks (what must finish before this task can start) and the resources required.
2. Build the dependency graph: tasks are nodes, predecessor relationships are edges. The graph must be acyclic (no circular dependencies).
3. Find the critical path: the longest path from start to finish. This is the minimum project duration if every task on the path finishes on time.
4. Identify the non-critical paths: tasks that have float (slack time before they delay the project). Note how much float each non-critical task has.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
