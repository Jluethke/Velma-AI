# Ci Relationship Mapper

Map the relationships between configuration items.

## Inputs

- `cmdb-scope`: CMDB scope and CI types
- `ci-types`: CI type definitions

## Outputs

- `relationship-model`: How CIs relate to each other (depends on, runs on, connects to)
- `service-maps`: Service dependency maps for critical services

## Process

1. Define the relationship types (depends on, runs on, connects to, contains).
2. Map the dependencies for each critical service top-down.
3. Validate the maps by walking a recent incident's impact path.
4. Document the relationship model.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
