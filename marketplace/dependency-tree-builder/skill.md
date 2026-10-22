# Dependency Tree Builder

For each critical function, map every dependency: the people, systems, vendors, data, and resources required for it to operate.

## Inputs

- `critical-function-list`: The ranked list of critical functions
- `operation-description`: Context about the operation

## Outputs

- `dependency-tree`: For each critical function: the complete list of dependencies (people, systems, vendors, data, physical resources), marked as single or redundant
- `single-dependency-list`: Every dependency that is the sole provider of a required capability, with no backup

## Process

1. For each critical function, walk through the execution from start to finish. At each step, ask: what person, system, vendor, data source, or physical resource does this step require?
2. For each dependency, ask: is there a second one that can perform the same function? If yes, mark it as redundant. If no, mark it as single.
3. Trace second-order dependencies: if Person A is a single dependency, what does Person A depend on? (Their laptop, their login credentials, their knowledge of the process.)
4. Map the dependencies into a tree structure where the critical function is the root and each branch is a dependency chain.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
