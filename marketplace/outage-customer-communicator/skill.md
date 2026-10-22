# Outage Customer Communicator

Communicate outage status and estimated restoration time to customers.

## Inputs

- `dispatch-plan`: Crew assignments and restoration sequence
- `restoration-timeline`: Estimated restoration timeline

## Outputs

- `customer-notifications`: Notifications sent to affected customers with ETR updates
- `communication-log`: Log of all customer communications during the event

## Process

1. Send initial notification to affected customers with the outage cause and estimated restoration time.
2. Update customers as crews report progress or the timeline changes.
3. Send restoration confirmation when power is restored to each area.
4. Log all communications for the post-event review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
