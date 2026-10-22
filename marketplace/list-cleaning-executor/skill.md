# List Cleaning Executor

Run a list cleaning pass based on the hygiene policy.

## Inputs

- `hygiene-policy`: The list hygiene rules
- `segment-definitions`: Segment criteria for identifying inactive subscribers

## Outputs

- `cleaning-results`: Count of records removed by reason (hard bounce, soft bounce, unsubscribe, inactive)
- `cleaned-list-size`: Subscriber count after cleaning

## Process

1. Remove all hard bounced addresses.
2. Remove addresses exceeding the soft bounce threshold.
3. Process pending unsubscribe requests.
4. Flag or remove dormant subscribers per the inactive threshold.
5. Log all removals with reason codes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
