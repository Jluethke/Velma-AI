# Process Inventory Collector

Inventory every recurring process, approval chain, meeting, report, and standing role on the team. Do not use the org chart or the process documentation. Instead, ask each team member: What do you do every week that you suspect adds no value? What approval do you need that feels unnecessary? What meeting do you attend that could be an email?

## Inputs

- `team-or-org-scope`: The team, department, or organization to audit for organizational debt
- `team-member-list`: The people to interview about their recurring activities

## Outputs

- `process-inventory`: Every recurring process, approval, meeting, report, and standing role, with the time spent per week and the number of people involved
- `team-suspicion-list`: Items that team members suspect add no value, with their reasoning

## Process

1. Ask each team member (anonymously if possible): What do you do every week that you suspect adds no value? What approval slows you down? What meeting could be eliminated?
2. Compile the responses. Count how many people flagged each item.
3. Add any recurring processes, meetings, or reports not flagged by the team (they may be so habitual that nobody questions them). Look at calendars and process documentation.
4. For each item, record: what it is, how often it occurs, how many people are involved, and how much time it consumes per occurrence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
