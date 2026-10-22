# Top Performer Identifier

Identify the top 5 performers in the role or team. Use output metrics (revenue generated, tickets resolved, code shipped, students advanced) rather than manager ratings. Manager ratings measure who the manager likes. Output metrics measure who produces results. If output metrics are not available, use peer nominations: ask each team member to name the person they would want on a critical project.

## Inputs

- `role-or-team`: The role or team you are building the hiring profile for
- `performance-data`: Available output metrics or peer nomination results for the team

## Outputs

- `top-performers-list`: The top 5 performers identified by output metrics or peer nominations, with the data supporting each selection
- `selection-method`: Which method was used (output metrics or peer nominations) and why

## Process

1. Collect output metrics for every person in the role. If multiple metrics exist, weight them by business impact.
2. Rank by the weighted metric. The top 5 are your interview subjects.
3. If output metrics are unavailable or unreliable, use peer nomination: ask each team member privately to name 2 people they would want on a critical project. The 5 with the most nominations are your subjects.
4. Record which method you used and why, so you can revisit if the resulting profile does not predict well.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
