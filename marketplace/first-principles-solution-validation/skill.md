# First Principles Solution Validation

Validate the rebuilt solution against the original problem and the hard constraints. A first-principles solution is only useful if it still solves the real need and breaks no genuine limit.

## Inputs

- `first-principles-solution`: A solution derived from the constraints
- `hard-constraints`: The real limits that survive scrutiny
- `problem-statement`: The problem restated with no solution assumed

## Outputs

- `validated-solution`: The solution after checking it against the problem and constraints
- `open-questions`: Risks and unknowns that need testing before committing

## Process

1. Check the solution against the original problem statement. Does it meet the real need, not a narrowed version?
2. Check it against every hard constraint. Any break sends you back to the rebuild step.
3. List the assumptions in the new solution that are still untested, and how you would test each one.
4. State the open questions plainly so the solution is not mistaken for proven before it is.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
