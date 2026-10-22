# Time Usage Auditor

Audit current time usage by logging activities for one week.

## Inputs

- `typical-week`: Description of a typical week's activities
- `work-hours`: Standard working hours and days

## Outputs

- `time-log`: Detailed log of how time was spent
- `time-categories`: Activities grouped by type (deep work, meetings, admin, personal)

## Process

1. Log every activity in 30-minute blocks for one week.
2. Categorize each block as deep work, meetings, admin, personal, or transition.
3. Calculate the percentage of time in each category.
4. Identify time sinks and unproductive patterns.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
