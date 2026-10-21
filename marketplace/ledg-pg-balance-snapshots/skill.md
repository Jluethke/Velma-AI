# Ledger PostgreSQL Balance Snapshots

**One-line description:** Computes account balances from postings and adds period-close balance snapshots in PostgreSQL that stay correct despite identity values not following commit order, with a closed-period trigger that blocks backdated postings and a recompute query that proves every snapshot.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ledger_schema` (object, required): Output of `ledg-pg-double-entry-schema`.
- `locking_strategy` (object, required): Output of `ledg-pg-balance-locking`. Tells whether a live balance row exists alongside snapshots.

---

## Outputs

- `balance_queries` (object): SQL for balance as of a time, the `accounting_periods` and `balance_snapshots` DDL, the period-close procedure, the closed-period trigger, and the recompute check output.

---

## Phase 1: Write the Derived Balance Query

### Entry Criteria
- `ledger_schema` acceptance checks passed.

### Actions
1. Balance of one account as of time `t` (by effective date):
```
SELECT coalesce(sum(p.amount_minor), 0) AS balance_minor
FROM postings p JOIN journal_entries e ON e.id = p.entry_id
WHERE p.account_id = $1 AND e.effective_at < $2;
```
2. For display, flip sign by account type: assets and expenses are debit-normal (show as is), liabilities, equity and revenue are credit-normal (show negated). Keep the stored sign unchanged.
3. Run `EXPLAIN (ANALYZE, BUFFERS)` on the query for the account with the most postings (`SELECT account_id, count(*) FROM postings GROUP BY 1 ORDER BY 2 DESC LIMIT 1`). Save the plan. If it is a sequential scan on `postings`, add `CREATE INDEX ON journal_entries (effective_at)` and consider `CREATE INDEX ON postings (account_id) INCLUDE (amount_minor, entry_id)` (INCLUDE needs PostgreSQL 11), then rerun the plan.

### Output
Derived balance query with plan.

### Quality Gate
- The saved plan exists, before and after any index change.
- The query returns the same value as a hand sum for one test account with known postings.

---

## Phase 2: Snapshot at Period Close

### Entry Criteria
- Derived query works.

### Actions
1. Do not snapshot by "highest posting id seen". Identity and sequence values are assigned at insert, not at commit: a transaction that took id 1000 can commit after one that took 1001, so a snapshot at id 1001 can silently miss 1000.
2. Snapshot by closed accounting period instead:
```
CREATE TABLE accounting_periods (
  id serial PRIMARY KEY,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  closed_at timestamptz,
  CHECK (ends_at > starts_at)
);
CREATE TABLE balance_snapshots (
  period_id int NOT NULL REFERENCES accounting_periods(id),
  account_id bigint NOT NULL REFERENCES accounts(id),
  balance_minor bigint NOT NULL,
  PRIMARY KEY (period_id, account_id)
);
```
3. Closed-period trigger on `journal_entries` BEFORE INSERT: raise an exception if `NEW.effective_at` falls inside any period with `closed_at IS NOT NULL`. This is what makes the snapshot final.
4. Close procedure, in one transaction:
   1. `SELECT ... FROM accounting_periods WHERE id = $p FOR UPDATE`.
   2. `LOCK TABLE journal_entries IN SHARE ROW EXCLUSIVE MODE;` so no insert with an effective date inside the period is in flight. This blocks posting briefly; schedule the close accordingly.
   3. Insert snapshots: previous period snapshot plus the sum of postings with `effective_at` in `[starts_at, ends_at)`, per account.
   4. `UPDATE accounting_periods SET closed_at = now() WHERE id = $p`.
   (`accounting_periods` is not a ledger table, so the append-only trigger does not apply to it.)
5. Balance as of `t` after this: latest closed snapshot with `ends_at <= t` plus the sum of postings with `effective_at` in `[that ends_at, t)`.

### Output
Period tables, trigger and close procedure.

### Quality Gate
- Inserting a journal entry with `effective_at` inside a closed period fails with the trigger message.
- The close procedure contains the `LOCK TABLE` step before the snapshot insert.

---

## Phase 3: Recompute and Compare

### Entry Criteria
- At least one period closed on test data.

### Actions
1. Recompute every snapshot from scratch:
```
SELECT s.period_id, s.account_id, s.balance_minor, r.recomputed
FROM balance_snapshots s
JOIN accounting_periods ap ON ap.id = s.period_id
JOIN LATERAL (
  SELECT coalesce(sum(p.amount_minor),0) AS recomputed
  FROM postings p JOIN journal_entries e ON e.id = p.entry_id
  WHERE p.account_id = s.account_id AND e.effective_at < ap.ends_at
) r ON true
WHERE s.balance_minor <> r.recomputed;
```
2. This must return zero rows. Schedule it as a recurring check (cron, pg_cron if installed, or the job runner) and alert on any row.
3. Sum of snapshots per period per currency must be zero (join to `accounts.currency`).
4. If `locking_strategy` has a live `account_balances` table, also compare it with the derived sum (query from `ledg-pg-balance-locking` Phase 3).

### Output
`balance_queries`.

### Quality Gate
- The recompute query returns zero rows.
- The per-currency snapshot sum query returns 0 for every currency in every closed period.

---

## Worked Example

Illustrative only. September 2026 closed on test data.
```
ledger_dev=> CALL ledger_close_period(9);
CALL
ledger_dev=> INSERT INTO journal_entries (idempotency_key, request_hash, description, effective_at)
             VALUES ('late-1','h','late fee','2026-09-30 10:00+00');
ERROR:  period 9 is closed; post with a current effective date
ledger_dev=> <recompute query>
 period_id | account_id | balance_minor | recomputed
-----------+------------+---------------+------------
(0 rows)
```

---

## Exit Criteria

DONE when balances derive from postings, snapshots are taken only for closed periods under a table lock, backdated posts into closed periods fail, and the recompute check returns zero rows.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Plan still a sequential scan after indexing | **Adjust**: run `ANALYZE postings;` and re-plan; if still slow, snapshots are the fix, not more indexes. |
| Phase 2 | Business needs backdated entries after close | **Return**: the user must define a reopen procedure that deletes no snapshot but adds an adjustment period; do not drop the trigger. |
| Phase 3 | Recompute mismatch | **Stop**: freeze the period, run `ledg-pg-audit-queries`, find the posting that entered after the snapshot. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
