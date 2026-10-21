# System Artifact Searcher

Search for system artifacts including browser history, registry hives, and event logs.

## Inputs

- `mounted-filesystem`: The read-only mounted filesystem
- `timeline-entries`: Timestamp data for correlation

## Outputs

- `artifact-collection`: Extracted browser history, registry entries, and event log data
- `artifact-summary`: Summary of findings organized by artifact type

## Process

1. Parse browser databases (Chrome, Firefox, Edge) for history, downloads, and cookies
2. Extract and analyze Windows registry hives or Linux config files
3. Parse system and application event logs
4. Correlate artifacts with the filesystem timeline

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
