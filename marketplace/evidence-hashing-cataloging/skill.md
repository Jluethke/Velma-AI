# Evidence Hashing Cataloging

Hash and catalog all collected evidence items.

## Inputs

- `memory-captures`: Collected memory dumps
- `disk-images`: Forensic disk images
- `collected-logs`: Aggregated log files

## Outputs

- `evidence-catalog`: Complete catalog of all evidence items with hashes and metadata
- `chain-of-custody-forms`: Chain-of-custody documentation for each evidence item

## Process

1. Compute SHA-256 hashes for every evidence item
2. Create a catalog entry for each item (source, type, size, hash, collection time, collector)
3. Fill out chain-of-custody forms for each item
4. Assign unique evidence identifiers to each item

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
