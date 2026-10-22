# Ingestion Layer Builder

Implement the ingestion layer for getting data into the lakehouse.

## Inputs

- `data-sources`: Source systems to ingest from
- `format-selection`: Storage formats and partitioning

## Outputs

- `ingestion-pipelines`: Implemented ingestion pipelines
- `ingestion-schedule`: Schedule for each ingestion job

## Process

1. Build connectors for each source system (batch, streaming, CDC).
2. Implement schema evolution handling for source changes.
3. Set up dead letter queues for failed records.
4. Configure the ingestion schedule and monitoring.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
