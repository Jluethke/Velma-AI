# Prevented Demand Projection

Project how much failure demand each source fix removes and how much capacity that releases. A fix is justified by the recurring load it deletes, not by the defect it corrects once.

## Inputs

- `source-fixes`: The designed source fixes
- `fix-effort-estimate`: Effort per fix

## Outputs

- `prevented-demand`: Failure-demand volume each fix removes
- `capacity-released`: The capacity freed when that demand stops arriving

## Process

1. For each fix, multiply the category volume it clears by how often it recurs to get prevented demand.
2. Convert prevented demand into the handling capacity it currently consumes.
3. Account for fixes that clear several categories at once through a shared cause.
4. Express the release as recurring capacity per period, not a one-time saving.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
