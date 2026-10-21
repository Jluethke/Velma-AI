# Concurrent Request Design

Design concurrent request sequences to exploit each identified race condition target.

## Inputs

- `race-target-list`: State-dependent operations to test
- `concurrency-model`: How the application handles concurrent requests

## Outputs

- `race-test-sequences`: Concurrent request sequences for each target
- `timing-parameters`: Concurrency level and timing parameters for each test

## Process

1. Build identical request pairs for double-spend scenarios
2. Design interleaved read-write sequences for TOCTOU exploitation
3. Set concurrency levels (10, 50, 100 simultaneous requests)
4. Define success criteria for detecting exploitation (balance < 0, count > limit)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
