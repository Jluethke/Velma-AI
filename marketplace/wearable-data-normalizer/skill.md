# Wearable Data Normalizer

Normalize wearable data from different platforms into a common schema.

## Inputs

- `api-config`: API integration configuration
- `data-types`: Data types to collect

## Outputs

- `common-schema`: The normalized data schema with mappings from each platform
- `data-store-config`: Storage configuration for the normalized data

## Process

1. Design the common schema that accommodates data from all platforms.
2. Map each platform's field names, units, and formats to the common schema.
3. Configure the data store with the common schema and set up automated ingestion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
