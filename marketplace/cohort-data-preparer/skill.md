# Cohort Data Preparer

Prepare the cohort data: for each time period, classify every user or customer as new, retained, resurrected, or churned.

## Inputs

- `user-activity-data`: Timestamped activity or transaction data per user or customer (at least 6 months)
- `metric-definition`: The growth metric to decompose (active users, revenue, customers, subscribers, members, anything that grows and shrinks)

## Outputs

- `cohort-classification`: For each period: count of new (first time active), retained (active previous period and this period), resurrected (inactive last period, active this period), and churned (active last period, inactive this period)
- `growth-equation-table`: Period-over-period table showing: opening count + new + resurrected - churned = closing count

## Process

1. Define 'active': what constitutes activity in your context? A login, a purchase, an engagement, a payment. Be specific and consistent.
2. For each period (week or month), classify every user: new (first appearance ever), retained (active in both this period and the prior period), resurrected (active this period but NOT the prior period, with at least one prior period of activity), or churned (active prior period, inactive this period).
3. Build the equation table: for each period, Opening = prior period's active count. Closing = Opening + New + Resurrected - Churned.
4. Verify: the closing count must equal the actual active count for that period. If it does not, the classification logic has an error.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
