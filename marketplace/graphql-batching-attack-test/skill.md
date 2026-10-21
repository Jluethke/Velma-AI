# Graphql Batching Attack Test

Test for batching and aliasing abuse to bypass rate limiting, brute-force credentials, or amplify queries.

## Inputs

- `graphql-endpoint`: URL of the GraphQL API endpoint
- `complexity-findings`: Complexity findings from depth testing

## Outputs

- `batching-findings`: Batching and aliasing vulnerabilities found
- `rate-limit-bypass-status`: Whether rate limiting can be bypassed through batching

## Process

1. Send array-batched queries and measure if rate limiting applies per batch or per query
2. Use field aliases to duplicate expensive operations in a single request
3. Test login mutations in batch to check for brute-force amplification
4. Measure server cost of batched vs individual requests

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
