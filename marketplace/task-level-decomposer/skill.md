# Task Level Decomposer

Decompose each deliverable into tasks: the work packages that one person can estimate and complete in one week or less.

## Inputs

- `deliverable-list`: The deliverables with acceptance criteria
- `deliverable-dependencies`: The dependency map

## Outputs

- `task-list`: Every task with its parent deliverable, estimated duration (in hours or days), and the person or skill required to complete it
- `uncertainty-flags`: Tasks that could not be decomposed to one week or less, indicating areas of high uncertainty that need investigation before estimation

## Process

1. For each deliverable, list the tasks: the specific work steps from start to the acceptance criterion. Each task should be completable by one person in one week or less.
2. If a task takes more than one week, decompose it further. Ask: what are the sub-steps? A task that cannot be broken down but still takes more than one week usually contains hidden complexity.
3. Estimate each task: hours or days. The estimate should come from the person who will do the work, not from the person who assigned it.
4. Flag tasks that resist decomposition: they cannot be broken down and the duration is uncertain. These are the areas of highest risk and need investigation (a spike, a proof of concept, or expert consultation) before the project plan can be finalized.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
