# Immutable Storage Designer

Design immutable storage and retention policies.

## Inputs

- `audit-record-schema`: Schema for audit records
- `compliance-requirements`: Retention and immutability requirements

## Outputs

- `storage-design`: Immutable storage architecture (append-only, hash chain, WORM)
- `retention-policy`: How long records are kept and when they are purged

## Process

1. Select the immutability mechanism (append-only log, hash chain, WORM storage).
2. Define the retention periods by event type and regulation.
3. Plan the archival and purge process.
4. Produce the storage design and retention policy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
