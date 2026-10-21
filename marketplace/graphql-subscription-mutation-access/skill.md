# Graphql Subscription Mutation Access

Test subscription and mutation access controls for unauthorized data streams and state changes.

## Inputs

- `graphql-endpoint`: URL of the GraphQL API endpoint
- `schema-map`: Schema map from introspection
- `authz-findings`: Authorization findings from resolver testing

## Outputs

- `subscription-findings`: Unauthorized subscription access issues
- `mutation-findings`: Unauthorized mutation execution issues

## Process

1. Subscribe to each subscription type with different auth contexts
2. Check if subscription filters leak data from other users or tenants
3. Execute each mutation as an unauthenticated and low-privilege user
4. Test for race conditions in mutations that modify shared state

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
