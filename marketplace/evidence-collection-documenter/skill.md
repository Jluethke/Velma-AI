# Evidence Collection Documenter

Document evidence collection with timestamps, hashes, and collector identity.

## Inputs

- `evidence-items`: List of digital evidence to be collected
- `case-identifier`: Case number and investigation reference

## Outputs

- `collection-records`: Documented collection records for each evidence item
- `initial-hashes`: Cryptographic hashes computed at time of collection

## Process

1. Assign a unique identifier to each evidence item
2. Compute MD5 and SHA-256 hashes at the point of collection
3. Photograph physical media and record serial numbers
4. Document the collector, date, time, location, and method

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
