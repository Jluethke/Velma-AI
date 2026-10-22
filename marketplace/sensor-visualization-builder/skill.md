# Sensor Visualization Builder

Build the visualization layer for sensor data.

## Inputs

- `storage-config`: The database configuration
- `query-interface`: The query interface for stored data

## Outputs

- `dashboard-config`: The dashboard configuration with panels and queries
- `pipeline-documentation`: Complete documentation of the sensor data pipeline

## Process

1. Design the dashboard layout with panels for each sensor type.
2. Write the queries to populate each panel from the time-series store.
3. Configure the refresh interval and time range selectors.
4. Compile the full pipeline documentation (schema, ingestion, storage, visualization).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
