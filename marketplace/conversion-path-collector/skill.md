# Conversion Path Collector

Collect conversion path data showing the sequence of touchpoints before conversion.

## Inputs

- `touchpoint-inventory`: Tracked touchpoints
- `conversion-goals`: Conversion events to analyze

## Outputs

- `path-data`: Conversion paths with touchpoint sequences and timestamps
- `path-statistics`: Average path length, time to conversion, common sequences

## Process

1. Extract conversion path data from analytics and CRM
2. Clean and deduplicate the paths
3. Calculate path statistics

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
