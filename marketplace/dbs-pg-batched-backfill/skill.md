# PostgreSQL Batched Backfill

**One-line description:** Backfills a new PostgreSQL column with a keyset-paginated loop that commits one bounded batch at a time, is safe to stop and restart, sets `lock_timeout`, watches replication lag and dead tuples between batches, and ends with a zero-row verification query.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `backfill_specs` (object[], required): From `dbs-expand-contract-plan`: table, key column, target column, source expression, "not yet done" predicate.
- `scratch_database_url` (string, required): Disposable PostgreSQL database loaded with production-shaped volume, for the rehearsal.
- `batch_size` (integer, required): Starting rows per batch, chosen by the user.
- `max_batch_seconds` (number, required): Longest a single batch may run, set by the service owner. Batches that exceed it trigger a smaller `batch_size`.

---

## Outputs

- `backfill_script` (string): The backfill script (Bash with `psql`) ready to run against any environment through `DATABASE_URL`.
- `backfill_report` (object): Rehearsal results: batches run, rows updated, slowest batch time, final verification query result, and the production run instructions.

---

## Phase 1: Prepare

### Entry Criteria
- The expand migration that adds the target column has been applied, and the app release that dual-writes the column is deployed everywhere (new rows already get the value).

### Actions
1. Confirm the key column is the primary key or has a unique B-tree index: `\d <table>` in `psql`.
2. Run `SELECT count(*) FROM <table> WHERE <predicate>;` and record the number of rows to backfill.
3. List triggers on the table: `SELECT tgname FROM pg_trigger WHERE tgrelid = '<table>'::regclass AND NOT tgisinternal;`. Each `UPDATE` fires them. Record whether that is intended (for example an `updated_at` trigger changes timestamps; decide with the owner).
4. Check that the predicate can use an index or that walking the primary key is enough. The loop below walks the primary key in order, so it does not need an index on the predicate.

### Output
Row count and trigger list.

### Quality Gate
- The pre-count is recorded with the query that produced it.
- The key column is shown unique in `\d` output.

---

## Phase 2: Write the Script

### Entry Criteria
- Phase 1 complete.

### Actions
1. Write `backfill_<table>_<column>.sh` with this structure (bigint key shown; values in angle brackets come from `backfill_specs`):
   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   : "${DATABASE_URL:?}" "${BATCH_SIZE:?}" "${LOCK_TIMEOUT:?}" "${SLEEP_SECONDS:?}"
   last_id="${START_ID:-0}"
   while true; do
     t0=$(date +%s.%N)
     row=$(psql "$DATABASE_URL" -q -At -v ON_ERROR_STOP=1 -c "
       SET lock_timeout = '${LOCK_TIMEOUT}';
       WITH batch AS (
         SELECT <key> FROM <table> WHERE <key> > ${last_id}
         ORDER BY <key> LIMIT ${BATCH_SIZE}
       ), upd AS (
         UPDATE <table> t SET <target> = <source>
         FROM batch b
         WHERE t.<key> = b.<key> AND <predicate on t>
         RETURNING t.<key>
       )
       SELECT coalesce(max(b.<key>), -1), (SELECT count(*) FROM upd) FROM batch b;")
     t1=$(date +%s.%N)
     next_id="${row%%|*}"; updated="${row##*|}"
     echo "$(date -Is) last_id=${last_id} next_id=${next_id} updated=${updated} seconds=$(echo "$t1 - $t0" | bc)"
     [ "$next_id" = "-1" ] && break
     last_id="$next_id"
     sleep "$SLEEP_SECONDS"
   done
   ```
2. Each `psql -c` call runs as one transaction, so every batch commits on its own. Never wrap the loop in `BEGIN`.
3. The loop walks the key in order and the predicate skips finished rows, so stopping and restarting is safe. To resume, set `START_ID` to the last logged `last_id`.
4. For a `uuid` key (UUID v7 sorts by time), start with `START_ID=00000000-0000-0000-0000-000000000000` and quote the value in SQL (`'${last_id}'`).
5. `LOCK_TIMEOUT` and `SLEEP_SECONDS` are user inputs. If a batch hits the lock timeout, `psql` exits with `55P03` and the script stops (because of `set -e`); rerun with `START_ID`.

### Output
`backfill_script`.

### Quality Gate
- `bash -n backfill_<table>_<column>.sh` exits 0 and `shellcheck` reports no errors if installed.
- The script contains no `BEGIN` and no `UPDATE` without the predicate.

---

## Phase 3: Rehearse and Verify

### Entry Criteria
- Script written; scratch database has production-shaped volume and the expand migration applied.

### Actions
1. Run the script against `scratch_database_url` with `BATCH_SIZE` = `batch_size`. Save the log.
2. Read the `seconds=` values. If any batch exceeds `max_batch_seconds`, stop, halve `BATCH_SIZE`, and rerun with `START_ID`. Record each size tried.
3. While it runs, watch from another session:
   - Replication lag on the primary: `SELECT application_name, replay_lag FROM pg_stat_replication;`. In production, pause the script (Ctrl+C, then resume with `START_ID`) when lag exceeds the limit the service owner gives.
   - Dead tuples: `SELECT n_dead_tup, last_autovacuum FROM pg_stat_user_tables WHERE relname = '<table>';`. Each updated row leaves a dead tuple until vacuum.
4. After the last batch run the verification query: `SELECT count(*) FROM <table> WHERE <predicate>;` must return 0. If the plan expects equality with the source: `SELECT count(*) FROM <table> WHERE <target> IS DISTINCT FROM <source>;` must return 0.
5. Run `VACUUM (ANALYZE) <table>;` after the backfill (plain `VACUUM` does not block reads or writes).
6. Write production run instructions: environment variables, where to run it (a host close to the database, inside `tmux` or `screen`), how to resume, and the lag limit.

### Output
`backfill_report`.

### Quality Gate
- Verification query returns 0, with output recorded.
- No batch in the final run exceeded `max_batch_seconds` (max of the `seconds=` column recorded).

---

## Common Mistakes To Avoid

- Do not run one `UPDATE <table> SET ...` over the whole table. It holds row locks on every row until commit, bloats the table, and can stall replicas.
- Do not page with `OFFSET`. Each batch rescans everything before it.
- Do not put the backfill inside a migration file; the tool runs it in one transaction.
- Do not start the backfill before the dual-write release is fully deployed; rows written by old instances would be missed.
- Do not claim done without the zero-row verification output.

---

## Worked Example

Illustrative only. Spec: table `customer`, key `id`, target `full_name`, source `name`, predicate `full_name IS NULL AND name IS NOT NULL`. User inputs: `batch_size` 5000, `max_batch_seconds` from the owner.

Phase 1: pre-count 1,204,331. One trigger `trg_customer_updated_at`; the owner decides it may fire during the backfill, and that decision is recorded.

Phase 3 log excerpt:
```
2026-10-20T14:02:11+00:00 last_id=0 next_id=5000 updated=5000 seconds=.41
2026-10-20T14:02:12+00:00 last_id=5000 next_id=10000 updated=4998 seconds=.39
...
2026-10-20T14:05:40+00:00 last_id=1210000 next_id=-1 updated=0 seconds=.02
```
Verification `SELECT count(*) FROM customer WHERE full_name IS NULL AND name IS NOT NULL;` returns 0.

---

## Exit Criteria

DONE when the script commits per batch, resumes from `START_ID`, stays under `max_batch_seconds` in rehearsal, and the verification query returns 0.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `backfill_specs` is empty | **Return**: emit an empty `backfill_script` and a `backfill_report` stating no data steps exist. |
| Phase 1 | Dual-write release not fully deployed | **Stop**: wait; the backfill would miss rows. |
| Phase 2 | No unique ordered key | **Return**: add one through an expand step, or use `ctid` ranges only with a DBA review. |
| Phase 3 | `55P03` lock timeout | **Retry**: rerun with `START_ID`; if it repeats on the same batch, find the blocking session with `pg_blocking_pids`. |
| Phase 3 | Verification returns rows | **Retry**: rerun from `START_ID=0`; if rows remain, the app is still writing NULL; fix the dual-write. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
