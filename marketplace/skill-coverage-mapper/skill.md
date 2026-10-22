# Skill Coverage Mapper

Build a matrix of who can do each skill and at what level: learning, competent, or expert. Use self-assessment checked against peer assessment, since self-assessment alone is unreliable.

## Inputs

- `required-skill-list`: The skills the work requires
- `skill-categories`: The skill categories

## Outputs

- `coverage-matrix`: A matrix of team members by skill, each cell holding learning, competent, or expert
- `confidence-notes`: Cells flagged low-confidence where self and peer assessments diverge

## Process

1. Ask each team member to rate themselves on each skill: learning, competent, or expert.
2. For each skill, ask one or two peers to confirm whether they would trust this person to handle a task needing it alone.
3. Where self and peer ratings diverge, default to the peer rating and flag the cell as low-confidence.
4. Record the matrix with team members as rows, skills as columns, and the level in each cell.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
