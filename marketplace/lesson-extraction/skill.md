# Lesson Extraction

Extract specific, actionable lessons from the root causes.

## Inputs

- `root-causes`: Root causes for major deltas
- `controllable-causes`: Causes within the team's control

## Outputs

- `lessons`: Specific lessons stated as: 'In situation [X], do [Y] instead of [Z], because [evidence from this event]'
- `lesson-owners`: Who is responsible for implementing each lesson

## Process

1. For each controllable root cause, write a lesson in the format: 'In situation [X], we should [Y] instead of [Z].' The lesson must be specific enough to act on.
2. 'Write better specs' is not a lesson. 'Before starting development, walk the team through 3 edge cases per spec section and resolve ambiguities in writing' is a lesson.
3. Assign an owner to each lesson. A lesson without an owner is a nice thought that will never be implemented.
4. Limit to 3-5 lessons. More than 5 and none will be implemented. Choose the lessons with the highest impact on future outcomes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
