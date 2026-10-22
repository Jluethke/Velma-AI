# Skill To Project Matcher

Match the skill you want to learn to a project type that forces encounter with the hard parts of that skill.

## Inputs

- `target-skill`: The skill you want to learn or improve
- `current-level`: Your current level in this skill (beginner, intermediate, advanced)

## Outputs

- `project-candidates`: 3 project ideas that would teach this skill through building, ranked by how many hard sub-skills they force you to use
- `hard-parts-coverage`: For each project, which hard parts of the skill it covers and which it skips

## Process

1. List the hard parts of the skill. Every skill has parts that beginners avoid and experts know are essential. For coding: debugging, error handling, edge cases. For writing: structure, editing, concision. For design: constraints, user testing, iteration.
2. For each hard part, design a project that forces you to encounter it. The project must make it impossible to skip the hard parts by making them central to the deliverable.
3. Rank the project candidates by hard-part coverage. The project that covers the most hard parts is the best learning project, even if it is harder.
4. Eliminate projects where you could succeed without using the target skill (e.g., a 'coding' project where you mostly copy existing code).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
