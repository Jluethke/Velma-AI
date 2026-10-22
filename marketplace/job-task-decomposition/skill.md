# Job Task Decomposition

Decompose the target role into the 3-5 tasks that occupy most of the working week. Ignore the job description. Instead, shadow or interview someone currently in the role and log what they actually do hour by hour for a full week. Rank the tasks by time spent and by impact on team output. The top 3 tasks by impact are the candidates for the work sample.

## Inputs

- `role-title`: The title of the role being hired for
- `current-holder-notes`: Notes from shadowing or interviewing someone currently in the role, logging their actual daily tasks

## Outputs

- `task-decomposition`: Ranked list of the role's actual tasks by time spent and impact, with the top 3 flagged as work sample candidates
- `impact-ranking`: Which tasks produce the most value for the team, independent of time spent

## Process

1. List every task the current holder performed during the observation period, with estimated hours per week.
2. For each task, rate its impact on team output: if this task were done poorly, how much would the team suffer?
3. Rank by impact. The top 3 are your work sample candidates. If the highest-impact task is also the hardest to simulate (e.g., crisis management), move to the next one.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
