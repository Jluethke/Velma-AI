# Fleet Uptime Reporter

Report fleet uptime, downtime causes, and maintenance cost trends.

## Inputs

- `fleet-service-log`: Complete service history for the fleet
- `fleet-cost-summary`: Cost data by vehicle and category

## Outputs

- `fleet-uptime-report`: Uptime percentage by vehicle and for the fleet, with downtime causes
- `fleet-program-document`: Complete fleet service program document with schedule, costs, and performance

## Process

1. Calculate the uptime percentage for each vehicle (days available divided by total days).
2. Categorize downtime by cause (scheduled maintenance, unscheduled repair, parts wait, accident).
3. Trend the fleet maintenance costs month over month.
4. Produce the fleet program document for the fleet manager.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
