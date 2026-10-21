# Graphql Resolver Authorization Test

Test authorization enforcement on each resolver by accessing data across user roles and permission boundaries.

## Inputs

- `graphql-endpoint`: URL of the GraphQL API endpoint
- `schema-map`: Schema map from introspection
- `auth-credentials`: Credentials for multiple user roles

## Outputs

- `authz-findings`: Authorization bypass vulnerabilities found per resolver
- `idor-findings`: Insecure direct object reference issues found

## Process

1. For each resolver, send queries as unauthenticated, low-privilege, and high-privilege users
2. Test for horizontal privilege escalation by accessing other users' data
3. Test for vertical privilege escalation by invoking admin-only mutations
4. Check that field-level authorization is enforced consistently across query paths

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
