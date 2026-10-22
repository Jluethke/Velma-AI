# Vector Data Loader

Load vectors into the database and verify integrity.

## Inputs

- `index-config`: Index configuration
- `schema-design`: Collection schema

## Outputs

- `loaded-index`: Populated vector index
- `load-report`: Load statistics (count, errors, duration)

## Process

1. Batch the vectors for efficient loading.
2. Load with progress tracking and error handling.
3. Verify the count matches the source.
4. Spot-check retrieval on known vectors.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
