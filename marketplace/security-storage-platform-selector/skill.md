# Security Storage Platform Selector

Select the storage platform for the security data lake balancing cost, query performance, and retention.

## Inputs

- `volume-estimates`: Daily and annual data volumes
- `detection-requirements`: Query patterns and latency requirements

## Outputs

- `storage-architecture`: Hot, warm, and cold storage tiers with technology choices
- `cost-model`: Estimated monthly storage and compute cost

## Process

1. Define storage tiers: hot (real-time queries, 30 days), warm (ad hoc, 1 year), cold (compliance, 7 years)
2. Evaluate technology options per tier (Elasticsearch, ClickHouse, S3/Parquet, BigQuery)
3. Estimate cost for each tier based on volume and query frequency
4. Select the technology stack and document the rationale

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
