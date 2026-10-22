# Source System Inventory

Inventory all source systems, data formats, and access methods.

## Inputs

- `source-systems`: List of source systems to connect to
- `data-requirements`: What data is needed and why

## Outputs

- `source-catalog`: Catalog of all source systems with formats and access methods
- `data-dictionary`: Field-level description of each source

## Process

1. List every source system and its data format (relational, API, flat file, streaming).
2. Document access methods, authentication, and rate limits for each source.
3. Build the data dictionary with field names, types, and cardinality.
4. Identify data freshness requirements and update frequencies.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
