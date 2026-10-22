# Version Changelog Designer

Design the changelog and communication process for API changes.

## Inputs

- `versioning-policy`: The versioning policy
- `consumer-base`: How to reach API consumers

## Outputs

- `changelog-format`: The changelog format: how changes are documented (added, changed, deprecated, removed, fixed)
- `communication-plan`: How changes are communicated to consumers (changelog, email, dashboard banner, migration guide)

## Process

1. Design the changelog format following Keep a Changelog conventions.
2. Define the communication channels for different change types (non-breaking: changelog only; breaking: email + migration guide).
3. Set the notice period for breaking changes (minimum 90 days recommended).
4. Design the deprecation notice format in API responses (Sunset header, Deprecation header).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
