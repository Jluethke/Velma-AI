# Ingestion Pipeline Designer

Design the ingestion and normalization pipeline to bring all sources into a common schema.

## Inputs

- `source-catalog`: All log sources and their formats
- `volume-estimates`: Expected data volumes

## Outputs

- `pipeline-architecture`: Ingestion pipeline design with collectors, parsers, enrichment, and routing
- `normalization-schema`: Common event schema (OCSF, ECS, or custom) with field mappings for each source

## Process

1. Select the ingestion technology (Kafka, Kinesis, Logstash, Fluentd, Cribl)
2. Design parsers for each source format to extract fields
3. Define the normalization schema (OCSF or Elastic Common Schema)
4. Add enrichment steps (GeoIP, threat intel, asset context, user identity)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
