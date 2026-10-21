# Graphql Depth Complexity Attack

Test for query depth and complexity denial-of-service vulnerabilities by crafting nested and wide queries.

## Inputs

- `graphql-endpoint`: URL of the GraphQL API endpoint
- `schema-map`: Schema map from introspection

## Outputs

- `complexity-findings`: Depth and complexity limits (or lack thereof) found
- `dos-risk-assessment`: Risk rating for query-based denial of service

## Process

1. Craft deeply nested queries using recursive type relationships
2. Send increasingly wide queries with many parallel field selections
3. Measure response times and server resource usage at each depth level
4. Determine the effective depth limit and complexity budget, if any

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
