# Multi Source Evidence Ingester

Ingest evidence from filesystem timestamps, logs, network captures, and memory artifacts.

## Inputs

- `evidence-sources`: List of evidence sources with their types and locations
- `investigation-window`: The time range to focus on

## Outputs

- `raw-events`: All extracted events in their native formats
- `source-catalog`: Catalog of evidence sources and their time ranges

## Process

1. Extract filesystem MACB timestamps using plaso or similar
2. Parse log entries from system, application, and security logs
3. Extract packet timestamps and session data from network captures
4. Pull process and connection timestamps from memory analysis

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
