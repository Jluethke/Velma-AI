# Database Race Test

Check for database-level race conditions in transaction isolation.

## Inputs

- `concurrency-model`: Database and transaction model
- `toctou-results`: File-level TOCTOU results

## Outputs

- `db-race-results`: Database race conditions found in transaction handling
- `isolation-level-assessment`: Assessment of transaction isolation level adequacy

## Process

1. Test for phantom reads and non-repeatable reads in critical transactions
2. Check whether SELECT FOR UPDATE or compare-and-swap locking is used
3. Test for deadlock conditions under concurrent access
4. Verify that atomic operations (INCREMENT, CAS) are used where needed

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
