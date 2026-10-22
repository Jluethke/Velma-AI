# Data Processing Deduplicator

Process collected data: deduplicate, filter by date range, and extract text and metadata.

## Inputs

- `collected-data-inventory`: Inventory of collected data
- `scope-document`: Scope for filtering criteria

## Outputs

- `processed-data-set`: Deduplicated, filtered data set ready for review
- `processing-report`: Statistics on data volumes before and after processing

## Process

1. Ingest the collected data into the processing platform.
2. Deduplicate by hash across all custodians.
3. Apply date range and file type filters from the scope document.
4. Extract text, metadata, and embedded content for review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
