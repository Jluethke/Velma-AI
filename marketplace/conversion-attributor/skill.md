# Conversion Attributor

Attribute conversions and revenue to email campaigns using UTM tracking and platform data.

## Inputs

- `raw-metrics`: Email engagement metrics
- `link-performance`: Per-link click data

## Outputs

- `conversion-data`: Conversions and revenue attributed to each campaign and link
- `attribution-notes`: Attribution methodology and known limitations

## Process

1. Match UTM-tagged clicks to downstream conversions (signups, purchases, form fills).
2. Calculate revenue per campaign where purchase data is available.
3. Note attribution limitations (last-click vs multi-touch, tracking gaps).
4. Produce the conversion dataset.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
