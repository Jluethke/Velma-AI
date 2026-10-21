# Serverless Abuse Potential Tester

Test for cold start abuse, timeout manipulation, and resource exhaustion.

## Inputs

- `function-inventory`: Function configurations with timeout and memory
- `trigger-map`: Event sources and invocation patterns

## Outputs

- `abuse-test-results`: Results of abuse and resource exhaustion tests
- `concurrency-limits-status`: Whether concurrency limits are set per function

## Process

1. Test whether functions can be invoked at a rate that exhausts concurrency limits
2. Check for timeout configurations that allow long-running abuse
3. Test whether recursive or circular invocations are possible
4. Verify that per-function concurrency limits and reserved capacity are set

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
