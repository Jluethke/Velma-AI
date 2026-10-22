# Provider Matching

Match the service request to an available provider based on skills, location, and schedule.

## Inputs

- `triaged-request`: The classified service request
- `scheduling-constraints`: Scheduling constraints

## Outputs

- `matched-providers`: Ranked list of available providers who can fulfill the request
- `proposed-slots`: Proposed appointment time slots based on provider availability and customer preferences

## Process

1. Query the provider roster for those with the required skills and certifications.
2. Filter by zone (prefer providers already working nearby to minimize travel time).
3. Check each provider's calendar for open slots that align with the customer's availability.
4. Rank the matches by fit (skills, proximity, schedule efficiency) and present the top options.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
