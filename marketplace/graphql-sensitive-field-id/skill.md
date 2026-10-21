# Graphql Sensitive Field Id

Identify sensitive fields and relationships in the schema that may expose protected data.

## Inputs

- `full-schema-map`: Complete schema map
- `operation-inventory`: Inventory of all operations

## Outputs

- `sensitive-fields`: List of fields that may expose sensitive data
- `relationship-paths`: Data relationship paths that could leak information

## Process

1. Flag fields by name pattern (email, password, token, ssn, secret)
2. Trace relationship paths that connect public to private data
3. Identify mutations that modify protected resources

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
