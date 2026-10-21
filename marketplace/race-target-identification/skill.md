# Race Target Identification

Identify state-dependent operations vulnerable to race conditions (balances, inventory, limits).

## Inputs

- `target-application`: Base URL and API endpoints of the authorized target
- `engagement-scope`: Written authorization and scope document

## Outputs

- `race-target-list`: State-dependent operations and their expected behavior
- `concurrency-model`: Application concurrency model (threads, async, database locks)

## Process

1. Identify operations that read-then-write shared state (account balance, coupon redemption, votes)
2. Map limit enforcement points (rate limits, purchase quantity limits, one-time actions)
3. Identify file operations with time-of-check-to-time-of-use gaps
4. Document the expected atomic behavior for each operation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
