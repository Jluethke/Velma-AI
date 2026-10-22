# Delegatee Readiness Matcher

Match each shortlisted task to a person and assess that person's readiness for it. Readiness sets the check-in cadence later: a person new to a task needs more contact, a proven one needs less.

## Inputs

- `delegation-shortlist`: The tasks to delegate now
- `retained-tasks`: The tasks you are keeping

## Outputs

- `task-person-matches`: Each task matched to a person who could take it
- `readiness-levels`: Each person's readiness for the matched task: new, has done parts, or has done it before

## Process

1. For each task, identify who could take it, favoring people with adjacent skills and room to grow.
2. Rate each person's readiness for the task: new to it, has done parts of it, or has done it before.
3. Avoid overloading one person with several single-point tasks at once.
4. Record each task-person match with its readiness level.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
