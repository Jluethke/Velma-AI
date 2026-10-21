# Backfill and Reconcile Old and New Stores

**One-line description:** Backfills history into the new store in keyset-paginated batches that are idempotent and resumable, then proves the two stores agree with row counts and per-key-range checksums computed the same way on both sides, and drills into any mismatched range down to the individual differing rows.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `schema_split_plan` (object, required): Tables and their old and new locations.
- `sync_strategy` (string, required): `outbox`, `cdc` or `dual_write_reconciled`.
- `database_engine` (string, required): `postgres` or `mysql`.
- `outbox_implementation` (object, optional): From `mex-transactional-outbox`.
- `pg_cdc_pipeline` (object, optional): From `mex-cdc-debezium-postgres`.
- `mysql_cdc_pipeline` (object, optional): From `mex-cdc-debezium-mysql`.

---

## Outputs

- `reconciliation_report` (object): Per table: backfill method, batch size used (user-supplied), rows copied, last key, count on each side, number of key ranges checked, mismatched ranges, differing keys with column diffs, and the repair actions taken.

---

## Phase 1: Decide Whether a Separate Backfill Is Needed

### Entry Criteria
- Ongoing sync from the chosen strategy is running or ready.

### Actions
1. Apply this table:

   | Strategy | Backfill |
   |---|---|
   | `cdc` with `snapshot.mode=initial` | The connector's snapshot is the backfill. Skip to Phase 3. |
   | `cdc` with a no-data snapshot mode | Run a Debezium incremental snapshot (signal table, see Debezium docs) or the batch copy below |
   | `outbox` | Events only cover changes after the outbox shipped; run the batch copy below for history |
   | `dual_write_reconciled` | Run the batch copy, then reconcile on a schedule |

2. Start ongoing sync before the backfill so no change made during the backfill is missed. The backfill writes must be upserts so a later sync event and a backfill row for the same key converge.

### Output
Backfill decision per table.

### Quality Gate
- Ongoing sync status is running (connector `RUNNING` or relay alive) before Phase 2 starts.

---

## Phase 2: Batch Copy

### Entry Criteria
- Batch copy required.

### Actions
1. Use keyset pagination on the primary key, never `OFFSET` (offset scans grow with each page):
   ```sql
   SELECT * FROM invoices WHERE id > :last_id ORDER BY id LIMIT :batch;
   ```
2. Write each batch to the new store with an upsert that does not overwrite newer data. PostgreSQL: `INSERT ... ON CONFLICT (id) DO UPDATE SET ... WHERE target.updated_at < EXCLUDED.updated_at`; MySQL: `INSERT ... ON DUPLICATE KEY UPDATE col = IF(VALUES(updated_at) > updated_at, VALUES(col), col)` (on MySQL 8.0.20+ the docs recommend a row alias instead of `VALUES()`). If there is no `updated_at` or version column, record it as an open question: without one, the backfill can overwrite a newer synced row.
3. Persist `:last_id` after each batch in a progress table or file so the job resumes after a crash.
4. `:batch` and any pause between batches are user inputs chosen against replica lag or database load; record them. Watch load while running: PostgreSQL `SELECT now() - pg_last_xact_replay_timestamp();` on a replica; MySQL `SHOW REPLICA STATUS\G` `Seconds_Behind_Source`.
5. Run against a replica or a read endpoint when possible.

### Output
Copied rows and final `last_id`.

### Quality Gate
- Final `last_id` equals `SELECT MAX(id)` on the source at the time the copy ended.
- The job was stopped and resumed once in non-production and finished with the same counts.

---

## Phase 3: Reconcile

### Entry Criteria
- Backfill finished or the CDC snapshot completed.

### Actions
1. Counts: `SELECT COUNT(*)` on both sides. A difference is expected only for rows changed in the last few seconds (sync lag); rerun for ranges older than the lag.
2. Range checksums. Split the key space into ranges (for example by `id` ranges or by `created_at` day). Compute the same checksum on both sides with a canonical text form of the compared columns:
   - PostgreSQL: `SELECT md5(string_agg(concat_ws('|', id, order_id, total_minor, status, updated_at), ',' ORDER BY id)) FROM invoices WHERE id BETWEEN :lo AND :hi;`
   - MySQL: `SELECT COUNT(*), BIT_XOR(CAST(CONV(SUBSTRING(MD5(CONCAT_WS('|', id, order_id, total_minor, status, updated_at)), 1, 16), 16, 10) AS UNSIGNED)) FROM invoices WHERE id BETWEEN :lo AND :hi;` (order-independent)
   Use the same function on both sides when both are the same engine. Across engines, compute in application code: fetch the rows sorted by key, format each the same way, and hash.
3. Normalize types before hashing: timestamps in UTC with fixed precision, decimals with fixed scale, NULL rendered as an explicit token (`concat_ws` skips NULLs, so use `coalesce(col::text, '\N')` in PostgreSQL and `IFNULL(col, '\\N')` in MySQL). Otherwise equal data hashes differently.
4. For each mismatched range, split it in half and recompute until ranges contain a few rows, then fetch both sides and diff the rows column by column.
5. Repair: re-copy the differing keys from the current single writer. Never repair by writing to the side that is the current writer.
6. Repeat the full reconciliation after the repair; record both runs.

### Output
`reconciliation_report`.

### Quality Gate
- Final run: zero mismatched ranges outside the sync lag window.
- Every repaired key appears in the report with before and after values.

---

## Worked Example

Illustrative. PostgreSQL to PostgreSQL, outbox strategy, `:batch` = 5000 (user choice, replica lag watched).

```
backfill invoices: 98764 rows, last_id=INV-0098764, 20 batches, resumed once at batch 11
count old=98764 new=98764
ranges checked: 99 (1000 ids each); mismatched: 1 (ids 41001-42000)
bisect -> id 41377: status old='V' new='P'
```
Cause: the backfill ran before the void was synced and the upsert lacked the `updated_at` guard. Guard added, key re-copied; second run: 0 mismatched ranges.

---

## Exit Criteria

DONE when history is copied with resumable idempotent batches (or covered by the CDC snapshot), and a full count and checksum reconciliation shows zero differences outside the sync lag.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Ongoing sync not running | **Stop**: start it first, or changes during backfill are lost. |
| Phase 2 | Replica lag climbs during copy | **Adjust**: pause and reduce `:batch` with the user's approval. |
| Phase 3 | Every range mismatches | **Retry**: normalization differs between sides (time zone, decimal scale, NULL token); fix the canonical form. |
| Phase 3 | Mismatches reappear after repair | **Return**: there is a second writer or a sync bug; report the keys to `mex-dual-write-or-cdc-decision`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
