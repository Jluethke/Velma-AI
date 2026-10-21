# Race Condition Execution

Execute race condition tests with precise timing using specialized tooling.

## Inputs

- `race-test-sequences`: Designed test sequences
- `timing-parameters`: Concurrency and timing settings

## Outputs

- `execution-results`: Raw results from each race condition test run
- `timing-logs`: Precise timestamps for request send and response receive

## Process

1. Execute tests using last-byte synchronization for maximum request overlap
2. Run each test multiple times to account for non-deterministic timing
3. Capture response bodies and status codes for all concurrent requests
4. Log server-side state changes through the application after each test run

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
