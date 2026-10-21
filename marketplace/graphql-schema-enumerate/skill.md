# Graphql Schema Enumerate

Enumerate the full GraphQL schema including types, queries, mutations, and subscriptions.

## Inputs

- `introspection-status`: Whether introspection is available
- `raw-schema-response`: Raw introspection response

## Outputs

- `full-schema-map`: Complete schema map with all types and operations
- `operation-inventory`: Inventory of all queries, mutations, and subscriptions

## Process

1. Parse the introspection response into a structured schema
2. If introspection is disabled, use field suggestion brute forcing
3. Catalog all types, fields, arguments, and their relationships

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
