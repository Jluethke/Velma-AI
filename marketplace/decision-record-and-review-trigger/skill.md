# Decision Record And Review Trigger

Record the decision with its ceiling math and set a trigger to re-run the test when the goal or the structure changes. A ceiling that was high enough last year can fall below a raised goal, flipping optimize into redesign.

## Inputs

- `action-plan`: The plan for the chosen path
- `game-change-options`: Structural options considered

## Outputs

- `decision-record`: The decision with its goal, ceiling, and chosen path
- `reevaluation-trigger`: The condition that forces re-running the ceiling test

## Process

1. Record the goal, the theoretical ceiling, the verdict, and the chosen path together.
2. Name the condition that would change the answer, such as a raised goal or a new step in the structure.
3. Set the trigger that forces re-running the ceiling test when that condition occurs.
4. Keep the record where the next review of the system will find it.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
