# Work Sample Task Designer

Design a work sample task that simulates one of the top-impact tasks in a 2-4 hour format. The task must be self-contained (no proprietary data), realistic (not a puzzle or trivia), and completable by someone who does not yet know your internal systems. Provide all necessary context in the task brief.

## Inputs

- `task-decomposition`: The ranked task list from the decomposition step
- `impact-ranking`: Which tasks matter most

## Outputs

- `work-sample-brief`: The complete task brief given to candidates, including context, deliverables, time limit, and any reference materials
- `compensation-terms`: How much the candidate is paid for completing the work sample, and when payment is made

## Process

1. Select the highest-impact task that can be simulated without proprietary data. If the real task uses internal tools, substitute with a publicly available equivalent.
2. Write the brief as if you were assigning the task to a new hire on day one. Include all the context they would need. If they need to ask clarifying questions to complete it, the brief is incomplete.
3. Set the time limit at 2-4 hours. Shorter tasks do not produce enough signal. Longer tasks impose too much on the candidate.
4. Set the compensation at the role's hourly rate for the time limit. Unpaid work samples select for candidates who can afford to work for free, which is a bias, not a filter.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
