# Graphql Batch Abuse Test

Test for batch query abuse including query batching for brute force and data extraction.

## Inputs

- `nesting-results`: Results of nested query tests
- `sensitive-fields`: Identified sensitive fields

## Outputs

- `batch-abuse-results`: Results of batch query abuse tests
- `rate-limit-findings`: Whether batching bypasses rate limits

## Process

1. Send batched queries to test for rate limit bypass
2. Test alias-based batching for data enumeration
3. Assess whether batch queries amplify resource consumption

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
