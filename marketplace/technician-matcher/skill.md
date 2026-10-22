# Technician Matcher

Match the work order to an available technician based on skills, proximity, and schedule.

## Inputs

- `work-order`: Work order with required skills and urgency
- `parts-estimate`: Parts needed to check technician truck stock

## Outputs

- `technician-assignment`: Selected technician with estimated arrival time
- `dispatch-confirmation`: Dispatch confirmation sent to the technician and customer

## Process

1. Query available technicians with the required skills and certifications.
2. Filter by proximity to the job site and current schedule availability.
3. Verify the technician's truck stock includes the estimated parts.
4. Assign the technician and send the dispatch notification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
