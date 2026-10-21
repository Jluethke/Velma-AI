# Graphql Nested Query Attack

Test for deeply nested query attacks that can cause denial of service or excessive data exposure.

## Inputs

- `full-schema-map`: Complete schema map
- `relationship-paths`: Data relationship paths

## Outputs

- `nesting-results`: Results of nested query depth tests
- `max-depth-reached`: Maximum query depth the server allows

## Process

1. Craft queries with increasing nesting depth on circular relationships
2. Measure response time and resource consumption at each depth
3. Identify the depth limit or lack of one

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
