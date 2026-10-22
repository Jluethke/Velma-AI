# Day Of Change Handler

Handle same-day changes to the service schedule (cancellations, delays, emergencies).

## Inputs

- `confirmed-appointment`: The confirmed appointment details
- `pre-visit-checklist`: The pre-visit checklist

## Outputs

- `schedule-adjustment`: The adjustment made (reschedule, reassign, cancel) and its downstream impact
- `service-scheduling-record`: Complete service scheduling record for this request

## Process

1. Receive the change trigger (customer cancels, provider is delayed, emergency takes priority).
2. Assess the impact: can the slot be backfilled? Does the delay cascade into later appointments?
3. Execute the adjustment: reschedule with the same provider, reassign to another provider, or cancel and rebook.
4. Notify all affected parties (customer, provider, dispatcher) and update the calendar.
5. Record the complete service scheduling lifecycle for this request.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
