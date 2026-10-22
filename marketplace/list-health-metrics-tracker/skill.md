# List Health Metrics Tracker

Track and report on list health metrics over time.

## Inputs

- `cleaning-results`: Results from the latest cleaning pass
- `consent-audit`: Current consent status across the list

## Outputs

- `list-health-report`: Report covering growth rate, churn rate, engagement distribution, deliverability indicators, and consent compliance
- `list-management-plan`: The complete list management plan with standards, segments, cleaning schedule, and metrics

## Process

1. Calculate the list growth rate (new subscribers minus removals over the period).
2. Calculate the churn rate (unsubscribes plus bounces divided by total).
3. Report the engagement distribution across segments.
4. Report the deliverability indicators (bounce rate, complaint rate).
5. Compile the full list management plan.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
