# Log Source Collector

Collect logs from all relevant sources for the investigation scope.

## Inputs

- `investigation-scope`: Time range, systems, and event types to collect
- `source-inventory`: List of available log sources and their locations

## Outputs

- `raw-log-archive`: Collected logs from all sources, preserved with hashes
- `collection-manifest`: Manifest of what was collected from where and when

## Process

1. Identify all relevant log sources within the scope
2. Collect system, application, network, and authentication logs
3. Preserve originals with cryptographic hashes
4. Document gaps where logs are missing or unavailable

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
