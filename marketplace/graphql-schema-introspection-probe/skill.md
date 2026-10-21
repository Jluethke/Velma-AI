# Graphql Schema Introspection Probe

Attempt schema introspection and catalog all types, queries, mutations, and subscriptions exposed by the API.

## Inputs

- `graphql-endpoint`: URL of the GraphQL API endpoint
- `auth-credentials`: Authentication tokens or credentials for the API

## Outputs

- `schema-map`: Full or partial schema with types, fields, and arguments
- `introspection-status`: Whether introspection is enabled, disabled, or partially restricted

## Process

1. Send the standard introspection query and record the response
2. If blocked, attempt partial introspection through field suggestions and error messages
3. Map all types, their relationships, and deprecated fields
4. Identify sensitive types and fields (user data, admin operations, internal identifiers)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
