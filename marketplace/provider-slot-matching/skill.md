# Provider Slot Matching

Match the request to available provider time slots based on visit type and constraints.

## Inputs

- `categorized-request`: Categorized appointment request
- `scheduling-constraints`: Constraints on scheduling

## Outputs

- `offered-slots`: List of available appointment slots that meet the criteria
- `waitlist-option`: Waitlist position if no immediate slots are available

## Process

1. Search the scheduling system for open slots matching the visit type and provider.
2. Filter by insurance network and authorization status.
3. Offer the patient the earliest available slots.
4. If no slots are available within the target timeframe, offer a waitlist position.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
