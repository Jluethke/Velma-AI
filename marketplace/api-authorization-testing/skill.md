# Api Authorization Testing

Test for broken object-level authorization (BOLA/IDOR) and broken function-level authorization across all endpoints.

## Inputs

- `endpoint-map`: Map of all endpoints
- `auth-weaknesses`: Known authentication weaknesses

## Outputs

- `authorization-findings`: List of authorization bypass vulnerabilities
- `idor-evidence`: Proof-of-concept for each IDOR finding

## Process

1. Test each parameterized endpoint for BOLA by substituting object IDs from other users.
2. Test function-level authorization by calling admin endpoints with regular user tokens.
3. Check for mass assignment by sending unexpected fields in create and update requests.
4. Verify that GraphQL queries enforce field-level authorization.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
