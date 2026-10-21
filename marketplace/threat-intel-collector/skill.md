# Threat Intel Collector

Collect threat intelligence from feeds, reports, sharing communities, and internal sources.

## Inputs

- `intel-sources`: List of subscribed feeds, sharing groups, and report providers
- `collection-requirements`: Priority intelligence requirements from stakeholders

## Outputs

- `raw-intel-collection`: Collected indicators, reports, and advisories in raw form
- `source-reliability-scores`: Reliability rating for each source based on historical accuracy

## Process

1. Pull indicators and reports from STIX/TAXII feeds and commercial providers
2. Collect human intelligence from sharing communities (ISACs, trusted groups)
3. Gather internal intelligence from incident investigations and threat hunts
4. Tag each item with source and collection timestamp

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
