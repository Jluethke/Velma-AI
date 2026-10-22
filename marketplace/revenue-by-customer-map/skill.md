# Revenue By Customer Map

Map revenue by customer and calculate each customer's share of total revenue.

## Inputs

- `revenue-data`: Revenue by customer for the past 12 months
- `customer-list`: All active customers

## Outputs

- `concentration-table`: Each customer's revenue and percentage of total, sorted by share descending
- `concentration-metrics`: Key metrics: largest customer share, top 3 customer share, number of customers representing 50% of revenue

## Process

1. Calculate each customer's total revenue over the past 12 months. Use actual invoiced revenue, not contracted value.
2. Sort by revenue share descending and calculate cumulative percentage.
3. Flag any customer above 15% as a concentration risk. Flag the 'whale' (largest customer) specifically.
4. Calculate how many customers represent 50% of revenue. If the answer is 3 or fewer, concentration is high.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
