# Callout Substitute Coordinator

Handle staff callouts and coordinate substitute coverage.

## Inputs

- `published-schedule`: The current published schedule
- `substitute-needs`: Known substitute needs

## Outputs

- `updated-schedule`: Schedule updated with substitute assignments or internal coverage shifts
- `staff-schedule`: Final schedule with hours tracked for payroll processing

## Process

1. When a callout is received, check the ratio impact on the affected classroom.
2. Contact available substitute teachers from the sub list in priority order.
3. If no substitute is available, adjust internal staff (float teachers, director coverage).
4. Update the schedule and notify affected staff.
5. Track actual hours worked for payroll at the end of the period.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
