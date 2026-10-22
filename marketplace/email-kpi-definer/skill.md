# Email Kpi Definer

Define the email KPIs and their calculation methods.

## Inputs

- `email-program-scope`: The scope of the email program (newsletter, lifecycle, transactional, promotional)
- `business-goals`: What the email program should achieve for the business

## Outputs

- `kpi-definitions`: Defined KPIs with formulas, data sources, and benchmarks (open rate, click rate, conversion rate, revenue per email, list growth rate, churn rate)
- `reporting-dimensions`: The dimensions to slice data by (campaign type, segment, time period, device, email client)

## Process

1. Define each KPI: name, formula, data source, industry benchmark, internal target.
2. Include health metrics (bounce rate, complaint rate, unsubscribe rate) alongside performance metrics.
3. Define the dimensions for slicing: by campaign type, by segment, by time (daily, weekly, monthly), by device.
4. Set the data refresh frequency for each metric.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
