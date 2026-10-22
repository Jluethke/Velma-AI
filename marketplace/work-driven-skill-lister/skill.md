# Work Driven Skill Lister

List the skills the work actually requires by deriving them from recent tasks, not from job descriptions. Include technical, process, and relationship skills, since the person who alone knows how to handle a key vendor is also a single point of failure.

## Inputs

- `team-scope`: The team being assessed
- `recent-work-log`: The tasks the team performed over the last quarter

## Outputs

- `required-skill-list`: The skills the work requires, derived from actual tasks at a specific level
- `skill-categories`: The skills grouped into technical, process, relationship, and domain-knowledge categories

## Process

1. List every distinct task the team performed over the last quarter, grouping similar tasks.
2. For each task group, name the skills required to do it, at a specific level rather than a broad category.
3. Include relationship and knowledge skills, such as who the key vendor trusts or who understands a legacy system.
4. Group the skills into technical, process, relationship, and domain-knowledge categories.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
