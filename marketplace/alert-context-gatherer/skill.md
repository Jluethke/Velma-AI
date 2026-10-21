# Alert Context Gatherer

Gather contextual information about the assets, users, and threat intelligence related to the alert.

## Inputs

- `classified-alert`: Alert with category and initial severity
- `alert-timeline`: Timestamp sequence of alert-related events

## Outputs

- `enriched-alert`: Alert enriched with asset, user, and threat intel context
- `related-alerts`: List of correlated alerts from the same timeframe or assets

## Process

1. Query the asset inventory for the affected system's owner, criticality, and network zone
2. Look up user activity in the identity provider and recent authentication logs
3. Check threat intelligence feeds for indicators mentioned in the alert
4. Search for related alerts on the same asset or user within the past 24 hours

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
