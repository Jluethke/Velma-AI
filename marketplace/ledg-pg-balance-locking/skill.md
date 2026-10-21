# Ledger PostgreSQL Balance Locking

**One-line description:** Chooses and implements a PostgreSQL concurrency strategy for account balances (derived balances, a locked balance row with ordered `SELECT ... FOR UPDATE`, or SERIALIZABLE with retry), enforces no-overdraft rules inside the lock, and proves it under concurrent load with pgbench.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ledger_schema` (object, required): Output of `ledg-pg-double-entry-schema`.
- `posting_service` (object, required): Output of `ledg-pg-idempotent-posting`.

---

## Outputs

- `locking_strategy` (object): Chosen strategy and why (row from the decision table), DDL for any balance table, the lock order rule, lock timeout setting source, the pgbench script path, and the invariant query results before and after load.

---

## Phase 1: Choose the Strategy

### Entry Criteria
- `posting_service` duplicate and conflict tests pass.

### Actions
1. Answer two questions from the user: (a) must any account be prevented from going below a limit at posting time (wallets, prepaid balances)? (b) is there a read path that needs the current balance faster than a `sum()` over postings allows (measure with `EXPLAIN (ANALYZE, BUFFERS)` on the sum query for the busiest account)?
2. Pick from this table:

| (a) limit check | (b) fast read needed | Strategy |
|---|---|---|
| no | no | Derived only: balance = `sum(amount_minor)` over postings. No balance table, no extra locks. |
| no | yes | Derived plus snapshots (`ledg-pg-balance-snapshots`). |
| yes | either | Balance row per account, locked with `SELECT ... FOR UPDATE` in ascending `account_id` order inside the posting transaction. |
| yes, and the team already runs SERIALIZABLE | either | SERIALIZABLE isolation with a read of the balance and the retry rule on `40001`. |

3. Record the answers and the row.

### Output
Strategy choice.

### Quality Gate
- The choice cites one table row and both answers.
- If (b) was answered yes, the `EXPLAIN (ANALYZE, BUFFERS)` output is saved.

---

## Phase 2: Implement the Locked Balance Row

### Entry Criteria
- Strategy is "balance row" or "SERIALIZABLE". For "derived only", skip to Phase 3 and use the sum query in the invariant.

### Actions
1. Migration:
```
CREATE TABLE account_balances (
  account_id    bigint PRIMARY KEY REFERENCES accounts(id),
  balance_minor bigint NOT NULL DEFAULT 0,
  min_balance_minor bigint,          -- NULL = no limit; value is a user input per account
  last_posting_id bigint NOT NULL DEFAULT 0
);
```
2. In `post_entry`, after the journal entry insert and before the postings insert:
```
SELECT account_id, balance_minor, min_balance_minor
FROM account_balances
WHERE account_id = ANY($1::bigint[])
ORDER BY account_id
FOR UPDATE;
```
Always lock in ascending `account_id`. Two transfers A to B and B to A that lock in different orders deadlock (`40P01`); one global order prevents it.
3. Compute each new balance in the application. If any `min_balance_minor` is not NULL and the new balance is below it, `ROLLBACK` and return an insufficient-funds error. Then `UPDATE account_balances SET balance_minor = balance_minor + $delta, last_posting_id = $max_id WHERE account_id = $id` for each account, in the same order.
4. Set a lock wait limit with `SET LOCAL lock_timeout = '<value>'` where the value is a user input; on SQLSTATE `55P03` (lock_not_available) return a retryable error.
5. SERIALIZABLE variant: `BEGIN ISOLATION LEVEL SERIALIZABLE;`, read balances with plain `SELECT`, post, commit, and retry the whole transaction on `40001` with the same idempotency key.
6. Hot accounts (one account touched by most postings, for example a platform fee account) serialize all writers behind one row lock. If measured lock waits on that account are the bottleneck, split it into N sub-rows (N is a user input) and pick a sub-row by hash of the idempotency key; the account balance is the sum of its sub-rows. Do this only for accounts with no limit check.

### Output
Balance table and locking code.

### Quality Gate
- `rg -n "FOR UPDATE"` in the posting code shows `ORDER BY account_id` on the same statement.
- The insufficient-funds test (post a debit that would cross `min_balance_minor`) returns the error and writes no rows.

---

## Phase 3: Load Test the Invariant

### Entry Criteria
- Implementation passes unit tests.

### Actions
1. Write `transfer.sql` for pgbench that calls the posting function between two random accounts:
```
\set a random(1, :naccounts)
\set b random(1, :naccounts)
SELECT ledger_transfer(:a, :b, 1);
```
(`ledger_transfer` is a SQL wrapper around the posting logic; skip pairs where `a = b` inside it.)
2. Run: `pgbench -n -c <clients> -j <threads> -T <seconds> -D naccounts=<n> -f transfer.sql "$DATABASE_URL"`. `-n` skips vacuum of the default pgbench tables, `-c` clients, `-j` worker threads, `-T` duration, `-D` defines a script variable. Client count, thread count, duration and account count are user inputs.
3. Read the output: `number of failed transactions` (shown in PostgreSQL 15 and later pgbench) and any `ERROR` lines. Deadlocks show as `deadlock detected`.
4. Invariant queries after the run:
```
SELECT count(*) FROM account_balances b
JOIN (SELECT account_id, sum(amount_minor) s FROM postings GROUP BY account_id) p USING (account_id)
WHERE b.balance_minor <> p.s;
SELECT currency, sum(amount_minor) FROM postings GROUP BY currency;
```
The first must return 0; the second must return 0 for every currency.
5. Turn on `log_lock_waits = on` for the test database during the run and read the server log for lock waits longer than `deadlock_timeout` (default 1s).

### Output
`locking_strategy`.

### Quality Gate
- pgbench output shows zero `deadlock detected` errors.
- Both invariant queries return 0.

---

## Worked Example

Illustrative only.
```
$ pgbench -n -c 16 -j 4 -T 60 -D naccounts=50 -f transfer.sql "$DATABASE_URL"
transaction type: transfer.sql
number of clients: 16
number of threads: 4
duration: 60 s
number of transactions actually processed: 48211
number of failed transactions: 0 (0.000%)
tps = 803.4 (without initial connection time)
ledger_dev=> SELECT count(*) FROM account_balances b JOIN (...) p USING (account_id) WHERE b.balance_minor <> p.s;
 count
-------
     0
```
Client and duration values above are the user's chosen test inputs, not recommendations.

---

## Exit Criteria

DONE when the strategy is chosen from the table, limit checks happen under the lock, locks are taken in one order, and a concurrent load run leaves balance rows equal to posting sums with zero deadlocks.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | User cannot answer the limit question | **Return**: list it as an open question; default to derived only, which adds no risk. |
| Phase 2 | `40P01` appears in tests | **Stop**: find the statement that locks out of order and fix it. |
| Phase 3 | Invariant count is non-zero | **Stop**: a code path updates postings without the balance row or the reverse; fix and rerun. |
| Phase 3 | pgbench reports failed transactions from lock timeout | **Adjust**: report the rate; raising `lock_timeout` is the user's decision. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
