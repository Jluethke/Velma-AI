# List Hygiene Protocol

Set up the list hygiene routine to keep deliverability high.

## Inputs

- `segment-definitions`: The segmentation rules including engagement tiers
- `opt-in-flow`: The opt-in process

## Outputs

- `hygiene-schedule`: Schedule for list cleaning tasks (bounce removal, re-engagement, sunset policy)
- `sunset-policy`: Rules for when to stop emailing and remove unengaged subscribers

## Process

1. Set the hard bounce removal rule (remove after first hard bounce).
2. Set the soft bounce escalation (remove after 3 consecutive soft bounces).
3. Design the re-engagement campaign for dormant subscribers (60 to 90 days inactive).
4. Define the sunset policy (remove after 120 days of zero engagement post re-engagement attempt).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
