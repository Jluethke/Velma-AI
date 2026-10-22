# Churn And Complaint Audit

List the types of people who buy but then churn, complain, or drain resources disproportionately.

## Inputs

- `customer-data`: Customer list with churn status, complaints, support tickets, and refund history
- `offering-description`: What you sell, do, or represent (product, service, personal brand, cause)

## Outputs

- `churn-complaint-patterns`: Recurring patterns among customers who churned, complained, or consumed disproportionate resources
- `high-cost-segments`: Segments that cost more to serve than they return in value

## Process

1. Pull the list of customers who churned within 90 days, or who filed more than two complaints, or who requested refunds.
2. For each, note what they expected, what they actually needed, and where the mismatch surfaced.
3. Group the patterns: wrong use case, wrong skill level, wrong budget range, wrong timeline expectations, or wrong values alignment.
4. Rank the groups by frequency and by cost (support time, refund dollars, team morale drain).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
