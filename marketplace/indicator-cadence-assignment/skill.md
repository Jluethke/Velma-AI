# Indicator Cadence Assignment

Assign the right measurement cadence to each indicator. Leading indicators get measured more frequently than lagging ones because the whole point is to see them move before the outcome does. A leading indicator measured monthly alongside a quarterly outcome gives you one data point of lead time, which is worthless.

## Inputs

- `validated-indicators`: The leading indicators that passed validation
- `lagging-metric`: The outcome metric with its natural measurement cadence

## Outputs

- `indicator-schedule`: Each indicator with its measurement cadence (daily, weekly, biweekly) and the person or system responsible for collecting it
- `review-cadence`: How often to review the leading indicators together and compare to the lagging metric trend

## Process

1. Set the lagging metric cadence to match its natural cycle (monthly revenue measured monthly, quarterly retention measured quarterly).
2. Set each leading indicator cadence to at least 4x the lagging metric cadence. If the lagging metric is monthly, leading indicators should be weekly at minimum.
3. For each indicator, assign a collection method (automated pull, manual entry, survey) and an owner. An indicator without an owner decays to zero within 3 weeks.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
