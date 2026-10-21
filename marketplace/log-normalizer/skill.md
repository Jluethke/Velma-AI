# Log Normalizer

Normalize log formats and timestamps to a common schema for correlation.

## Inputs

- `raw-log-archive`: The collected raw logs in various formats
- `collection-manifest`: Manifest describing each log source and format

## Outputs

- `normalized-logs`: All logs in a common format with unified timestamps
- `normalization-report`: Report of format conversions and any data loss

## Process

1. Parse each log format (syslog, JSON, CSV, Windows Event XML)
2. Convert all timestamps to UTC with millisecond precision
3. Map fields to a common schema (source, event type, actor, target, outcome)
4. Flag entries that could not be fully parsed

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
