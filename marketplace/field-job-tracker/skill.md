# Field Job Tracker

Track the technician's progress from dispatch through arrival, work, and completion.

## Inputs

- `technician-assignment`: Assigned technician and job details
- `dispatch-confirmation`: Dispatch details and estimated arrival

## Outputs

- `job-status-log`: Timestamped log of job milestones (en route, arrived, working, complete)
- `completion-report`: Technician's report of work performed, parts used, and time spent

## Process

1. Track the technician's en-route status and update the customer with ETA.
2. Record the arrival time and any scope changes discovered on site.
3. Log parts used, labor time, and work performed.
4. Capture the customer signature and satisfaction rating on completion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
