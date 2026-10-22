# Sensor Data Store Setup

Configure the time-series database for storing sensor data.

## Inputs

- `data-schema`: The telemetry data schema
- `ingestion-config`: The ingestion endpoint configuration

## Outputs

- `storage-config`: The database configuration (schema, retention, partitioning)
- `query-interface`: The query interface for accessing stored data

## Process

1. Create the database tables or collections matching the data schema.
2. Configure the retention policy (how long to keep raw data, when to downsample).
3. Set up the partitioning strategy for query performance.
4. Verify data flows from ingestion to storage correctly.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
