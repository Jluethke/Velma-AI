# List Hygiene Standards Definer

Define the hygiene standards for the email list including bounce handling, unsubscribe processing, and inactive removal rules.

## Inputs

- `current-list-size`: Current number of subscribers on the list
- `list-platform`: The email service provider or platform hosting the list

## Outputs

- `hygiene-policy`: Documented rules for bounce handling, unsubscribe processing, and inactive removal
- `cleaning-schedule`: Frequency and scope of list cleaning runs

## Process

1. Set the hard bounce removal rule (remove after first hard bounce).
2. Set the soft bounce threshold (remove after N consecutive soft bounces within a time window).
3. Define the unsubscribe processing standard (immediate removal, confirmation page, feedback survey).
4. Define the inactive subscriber threshold (no opens or clicks in N days) and the removal or re-engagement trigger.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
