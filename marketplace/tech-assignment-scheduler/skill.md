# Tech Assignment Scheduler

Assign the work order to a maintenance tech or vendor and schedule the visit.

## Inputs

- `work-order`: Classified work order
- `urgency-classification`: Urgency level

## Outputs

- `assignment-record`: Tech or vendor assigned with scheduled date
- `tenant-notification`: Notification sent to the tenant with the scheduled visit

## Process

1. Match the work type to available techs or vendors.
2. Schedule based on urgency: emergency same-day, urgent within 24 hours, routine within 5 business days.
3. Notify the tenant of the assigned tech and scheduled date.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
