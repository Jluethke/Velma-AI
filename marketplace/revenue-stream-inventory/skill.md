# Revenue Stream Inventory

Inventory every distinct revenue stream with its amount, percentage of total, and dependency characteristics.

## Inputs

- `revenue-data`: 12 months of income or revenue data broken out by source
- `revenue-context`: Whether this is personal income (salary, freelance, investments, side income) or business revenue (customers, products, channels)

## Outputs

- `stream-inventory`: Each revenue stream with its 12-month total, monthly average, percentage of total revenue, and trend (growing, flat, declining)
- `stream-count`: Total number of distinct revenue streams

## Process

1. List every distinct source of income or revenue. For personal: separate employer salary, each freelance client, investment income, rental income, and any other source. For business: separate by customer (or customer segment if too many individual customers), product line, and channel.
2. For each stream, calculate the 12-month total and the monthly average. Calculate the percentage of total revenue that each stream represents.
3. Determine the trend for each stream by comparing the most recent 3 months to the preceding 3 months. Flag any stream that is declining by more than 10% because concentration risk increases when a declining stream is also a large one.
4. Count the total number of distinct streams. Fewer than 3 streams is a structural concentration problem regardless of the HHI score.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
