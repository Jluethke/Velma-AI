# Path Branch Decision

Choose the path the verdict dictates: optimize the existing structure, or change the structure itself. Optimizing a structure whose ceiling is below the goal wastes effort that can only ever fall short.

## Inputs

- `sufficiency-verdict`: Whether the ceiling clears the goal
- `gap-size`: Distance from ceiling to goal

## Outputs

- `chosen-path`: Either optimize the structure or change the structure
- `path-rationale`: Why the verdict points to that path

## Process

1. If the optimized ceiling clears the goal, choose to optimize the existing structure.
2. If the optimized ceiling falls below the goal, choose to change the structure.
3. When the ceiling clears the goal only barely, weigh the cost of optimizing against the risk of running at the edge.
4. Record the rationale so the chosen path is traceable to the sufficiency verdict.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
