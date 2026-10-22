# Feedback Resolution Tracker

Track the resolution status of each routed feedback item against its SLA.

## Inputs

- `routed-items`: Feedback items assigned to teams with SLAs

## Outputs

- `resolution-status`: Current status of each item (open, in progress, resolved, overdue)
- `sla-compliance-rate`: Percentage of items resolved within SLA

## Process

1. Track each item through its lifecycle (open, in progress, resolved, closed).
2. Send reminders to the assigned team when items approach their SLA deadline.
3. Escalate overdue items to the team lead.
4. Calculate the SLA compliance rate by team and category.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
