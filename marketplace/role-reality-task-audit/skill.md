# Role Reality Task Audit

Identify the tasks that actually fill the working week for this role, ignoring the job posting. Shadow or interview a current holder, log what they do, rank tasks by impact on team output, and keep the two or three highest-impact tasks that can be simulated without internal systems.

## Inputs

- `role-title`: The title of the role being hired for
- `current-holder-log`: A log from shadowing or interviewing someone currently in the role, recording their actual tasks

## Outputs

- `ranked-task-list`: Every task the current holder performs, ranked by impact on team output rather than by hours spent
- `work-sample-candidate-tasks`: The two or three highest-impact tasks that can be simulated without proprietary data, flagged as work sample candidates

## Process

1. List every task the current holder performed over one full working week, with estimated hours for each.
2. Rate each task on impact: if it were done poorly, how much would the team suffer? Rank by impact, not by hours.
3. Keep the two or three highest-impact tasks that can be simulated without proprietary data or internal tools. If the top task needs internal systems, substitute a public equivalent.
4. Record which tasks you dropped and why, so the work sample cannot be accused of testing the wrong thing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
