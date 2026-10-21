# Ledger PostgreSQL Audit Queries

**One-line description:** Builds and runs a pack of PostgreSQL audit queries over a double-entry ledger (trial balance per currency, unbalanced or single-posting entries, currency mismatches, double reversals, backdated posts, snapshot drift, account activity trail) inside one read-only repeatable-read transaction, with every query expected to return zero rows or zero sums.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ledger_schema` (object, required): Output of `ledg-pg-double-entry-schema`.
- `balance_queries` (object, required): Output of `ledg-pg-balance-snapshots`.

---

## Outputs

- `audit_query_pack` (object): Path of `audit.sql`, the list of checks with expected results, the run command, the latest run output with pass or fail per check, and the trial balance per account per currency for the period (the input the accounting sync flows read).

---

## Phase 1: Write the Pack

### Entry Criteria
- The schema and snapshot tables exist.

### Actions
1. Create `audit.sql` beginning with `BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;` and ending with `COMMIT;` so every check sees one consistent snapshot.
2. Add these checks, each preceded by `\echo CHECK <name> expect <expectation>`:

| Name | Query | Expect |
|---|---|---|
| trial_balance | `SELECT currency, sum(amount_minor) FROM postings GROUP BY currency HAVING sum(amount_minor) <> 0;` | 0 rows |
| unbalanced_entries | `SELECT entry_id, currency, sum(amount_minor) FROM postings GROUP BY entry_id, currency HAVING sum(amount_minor) <> 0;` | 0 rows |
| short_entries | `SELECT e.id FROM journal_entries e LEFT JOIN postings p ON p.entry_id = e.id GROUP BY e.id HAVING count(p.id) < 2;` | 0 rows |
| currency_mismatch | `SELECT p.id FROM postings p JOIN accounts a ON a.id = p.account_id WHERE a.currency <> p.currency;` | 0 rows |
| double_reversal | `SELECT reverses_entry_id FROM journal_entries WHERE reverses_entry_id IS NOT NULL GROUP BY 1 HAVING count(*) > 1;` | 0 rows |
| reversal_mismatch | For each reversal R of entry O, per account: sum over O and R is not zero. | 0 rows |
| backdated | `SELECT id, effective_at, posted_at FROM journal_entries WHERE posted_at - effective_at > :lag::interval;` with `lag` a user-set interval passed as a psql variable | reviewed list (not a failure by itself) |
| snapshot_drift | the recompute query from `balance_queries` | 0 rows |
| duplicate_keys | `SELECT idempotency_key FROM journal_entries GROUP BY 1 HAVING count(*) > 1;` | 0 rows |

3. Add the period trial balance by account (input to accounting sync): `SELECT a.code, a.type, p.currency, sum(p.amount_minor) FROM postings p JOIN accounts a ON a.id = p.account_id JOIN journal_entries e ON e.id = p.entry_id WHERE e.effective_at >= :'from' AND e.effective_at < :'to' GROUP BY 1,2,3 ORDER BY 1;`
4. Add the activity trail for one account, for investigations: entries, postings, `posted_at`, `external_ref`, and `reverses_entry_id` ordered by `posted_at`.
5. Some checks duplicate database constraints on purpose. Constraints can be dropped or disabled; the audit proves they held.

### Output
`audit.sql`.

### Quality Gate
- The file starts with the read-only repeatable-read `BEGIN` and every check has an `\echo` line with its expectation.

---

## Phase 2: Run and Read

### Entry Criteria
- `audit.sql` exists. Run against a replica or a read-only role when the primary is busy.

### Actions
1. Run: `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -v from='2026-10-01' -v to='2026-11-01' -v lag="'7 days'" -f audit.sql > audit_out.txt` (dates and lag are the user's values). `-v name=value` sets psql variables read as `:'from'` in the file.
2. Read `audit_out.txt` check by check. A check with expectation `0 rows` passes only if psql printed `(0 rows)` under it.
3. For heavy checks, run `EXPLAIN (ANALYZE, BUFFERS)` once and record the time; if the pack runs longer than the user's maintenance window, move it to a replica rather than dropping checks.
4. Record pass or fail per check in `audit_query_pack`.

### Output
`audit_query_pack`.

### Quality Gate
- `rg -c "\(0 rows\)" audit_out.txt` equals the number of zero-row checks, or each failing check is listed with its rows.
- psql exit code is 0.

---

## Worked Example

Illustrative only.
```
$ psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -v from='2026-10-01' -v to='2026-11-01' -v lag="'7 days'" -f audit.sql
BEGIN
CHECK trial_balance expect 0 rows
 currency | sum
----------+-----
(0 rows)
CHECK unbalanced_entries expect 0 rows
(0 rows)
CHECK backdated expect reviewed list
  id  |      effective_at      |        posted_at
------+------------------------+------------------------
 4412 | 2026-10-02 00:00:00+00 | 2026-10-14 09:13:22+00
(1 row)
COMMIT
```
Entry 4412 goes to the reviewed list with its description; the other checks pass.

---

## Exit Criteria

DONE when the pack runs in one read-only repeatable-read transaction, every zero-row check passes or is reported with rows, and the period trial balance by account is produced.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A table from the list is missing | **Return**: run the flow that creates it; do not delete the check. |
| Phase 2 | trial_balance or unbalanced_entries returns rows | **Stop**: freeze posting for the affected accounts and investigate with the activity trail; the balance trigger was bypassed. |
| Phase 2 | Pack too slow on primary | **Adjust**: run on a replica; keep every check. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
