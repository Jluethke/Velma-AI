# Versioning Scheme Selector

Choose the versioning scheme and define the rules.

## Inputs

- `change-taxonomy`: Types and frequency of API changes
- `consumer-sensitivity`: Consumer impact analysis

## Outputs

- `versioning-scheme`: Chosen approach (URL path, header, query param) with rules for when to increment
- `compatibility-rules`: What constitutes a breaking vs non-breaking change

## Process

1. Evaluate versioning approaches: URL path (/v1/), header (Accept-Version), query parameter.
2. Select the approach based on consumer needs and operational complexity.
3. Define the rules: what changes require a new version, what changes are backwards-compatible.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
