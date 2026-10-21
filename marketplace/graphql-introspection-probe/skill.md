# Graphql Introspection Probe

Test whether GraphQL introspection is enabled and accessible.

## Inputs

- `graphql-endpoint`: URL of the GraphQL endpoint
- `auth-tokens`: Authentication tokens for the test

## Outputs

- `introspection-status`: Whether introspection is enabled or disabled
- `raw-schema-response`: Raw introspection response if available

## Process

1. Send the standard __schema introspection query
2. Test introspection with and without authentication
3. Try alternate introspection paths if the standard one is blocked

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
