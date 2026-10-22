# Campaign Metrics Collector

Collect campaign metrics from the email platform: sends, deliveries, opens, clicks, bounces, unsubscribes.

## Inputs

- `campaign-ids`: The campaigns to analyze (by ID, date range, or tag)
- `tracking-setup`: UTM parameters and conversion tracking configuration

## Outputs

- `raw-metrics`: Per-campaign metrics: send count, delivery rate, open rate, click rate, bounce rate, unsubscribe rate
- `link-performance`: Click-through data per link in each campaign

## Process

1. Pull delivery and engagement metrics from the email platform.
2. Pull click data broken down by individual link.
3. Normalize rates (open rate = opens / delivered, not opens / sent).
4. Compile the raw metrics dataset.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
