# Crash Triage Dedup

Triage crashes and error responses by uniqueness to eliminate duplicates.

## Inputs

- `raw-results`: Complete fuzzing run log

## Outputs

- `unique-findings`: Deduplicated list of distinct error classes
- `triage-summary`: Summary of finding categories and counts

## Process

1. Group error responses by HTTP status code and error message pattern
2. Cluster similar stack traces or error signatures
3. Deduplicate: keep one representative case per unique finding

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
