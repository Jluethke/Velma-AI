# Intake Quality Reviewer

Review intake quality and report on request volumes, response times, and assignment patterns.

## Inputs

- `assignment-record`: Assignment records for the period
- `response-timeline`: Committed response timelines

## Outputs

- `intake-metrics`: Metrics on request volume, category distribution, average response time, and SLA compliance
- `intake-record`: Complete intake record for the request

## Process

1. Track whether the committed response timeline was met.
2. Aggregate intake metrics: volume by category, urgency distribution, average assignment time.
3. Identify bottlenecks or categories with consistently slow response.
4. Produce the intake record and metrics report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
