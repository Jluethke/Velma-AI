# Activity Reverse Engineer

For each outcome, work backward to the activities required to produce it. If the outcome is 'reduce ticket resolution time from 4 hours to 2 hours,' the activities might be: analyze the current resolution process, identify the bottlenecks, redesign the triage workflow, train the team on the new workflow, monitor the resolution time metric weekly.

## Inputs

- `role-outcomes`: The measurable outcomes the role must deliver
- `outcome-priorities`: Which outcomes matter most

## Outputs

- `activity-map`: For each outcome: the specific activities required to produce it, with estimated time per week
- `total-time-estimate`: The total estimated time per week across all activities, as a sanity check against available hours

## Process

1. For each outcome, list every activity that must happen to move the metric from the current level to the target level.
2. For each activity, estimate the time per week. Be realistic. Include not just the doing but the meetings, communication, and coordination required.
3. Sum the time across all outcomes. If the total exceeds 50 hours per week, the role is overloaded. Cut the lowest-priority outcome or split the role.
4. Flag activities that require skills not usually found in the same person (e.g., deep data analysis AND executive-level presentation). These signal a potential role split.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
