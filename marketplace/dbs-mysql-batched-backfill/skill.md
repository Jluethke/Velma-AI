# MySQL Batched Backfill

**One-line description:** Backfills a new MySQL InnoDB column in primary-key ranges found by keyset lookups, commits each range with autocommit under READ COMMITTED to avoid gap locks, pauses on replica lag from `SHOW REPLICA STATUS`, and ends with a zero-row verification query.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `backfill_specs` (object[], required): From `dbs-expand-contract-plan`: table, key column, target column, source expression, "not yet done" predicate.
- `scratch_database_url` (string, required): Disposable MySQL server of the production version with production-shaped volume, for the rehearsal. Pass credentials through an option file, not the command line.
- `batch_size` (integer, required): Starting rows per batch, chosen by the user.
- `max_batch_seconds` (number, required): Longest a single batch may run, set by the service owner.

---

## Outputs

- `backfill_script` (string): The backfill script (Bash with the `mysql` client).
- `backfill_report` (object): Rehearsal results: batches, rows updated, slowest batch, verification result, and production run instructions.

---

## Phase 1: Prepare

### Entry Criteria
- The expand migration is applied and the dual-write app release is deployed everywhere.

### Actions
1. Confirm the key is the primary key: `SHOW CREATE TABLE <table>\G`.
2. Record the pre-count: `SELECT COUNT(*) FROM <table> WHERE <predicate>;`.
3. Record `SELECT @@binlog_format, @@transaction_isolation;`. READ COMMITTED for the backfill session needs `binlog_format=ROW` (InnoDB refuses statement-based binary logging under READ COMMITTED).
4. List triggers: `SHOW TRIGGERS LIKE '<table>';`. Record whether each should fire for the backfill.
5. Write an option file `~/.backfill.cnf` with `[client]` host, user, password, and chmod 600. Use `mysql --defaults-extra-file=~/.backfill.cnf`.

### Output
Pre-count, binlog format, triggers.

### Quality Gate
- `SHOW CREATE TABLE` output shows the key as `PRIMARY KEY`.
- `@@binlog_format` is recorded; if it is not `ROW`, Phase 2 keeps the default isolation and records why.

---

## Phase 2: Write the Script

### Entry Criteria
- Phase 1 complete.

### Actions
1. Write `backfill_<table>_<column>.sh`:
   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   : "${BATCH_SIZE:?}" "${LOCK_WAIT:?}" "${SLEEP_SECONDS:?}" "${DB:?}"
   M="mysql --defaults-extra-file=$HOME/.backfill.cnf -N -B $DB"
   lo="${START_ID:-0}"
   while true; do
     hi=$($M -e "SELECT <key> FROM <table> WHERE <key> > ${lo} ORDER BY <key> LIMIT 1 OFFSET $((BATCH_SIZE-1));")
     [ -z "$hi" ] && hi=$($M -e "SELECT COALESCE(MAX(<key>), ${lo}) FROM <table>;")
     [ "$hi" = "$lo" ] && break
     t0=$(date +%s.%N)
     n=$($M -e "SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
                SET SESSION innodb_lock_wait_timeout = ${LOCK_WAIT};
                UPDATE <table> SET <target> = <source>
                WHERE <key> > ${lo} AND <key> <= ${hi} AND <predicate>;
                SELECT ROW_COUNT();")
     t1=$(date +%s.%N)
     echo "$(date -Is) lo=${lo} hi=${hi} updated=${n} seconds=$(echo "$t1 - $t0" | bc)"
     lo="$hi"
     sleep "$SLEEP_SECONDS"
   done
   ```
2. Each `mysql -e` call runs with autocommit on, so the `UPDATE` commits on its own.
3. The upper bound comes from a keyset lookup (`LIMIT 1 OFFSET batch-1` starting after `lo`), so gaps in IDs do not make batches uneven. The `OFFSET` here scans at most `BATCH_SIZE` index entries from `lo`, not the whole table.
4. Never use `UPDATE ... LIMIT n` without `ORDER BY`; MySQL flags it as unsafe for statement-based replication and the rows chosen are not deterministic.
5. READ COMMITTED turns off gap locking for the range scan, so the backfill does not block inserts near the end of the key range. Drop that line if `binlog_format` is not `ROW`, and record it.
6. `LOCK_WAIT` and `SLEEP_SECONDS` are user inputs. A lock wait timeout (error 1205) stops the script; resume with `START_ID` set to the last logged `lo`.
7. For `BINARY(16)` UUID v7 keys, pass bounds as `0x<hex>` literals and print them with `HEX(<key>)`.

### Output
`backfill_script`.

### Quality Gate
- `bash -n` exits 0 and `shellcheck` reports no errors if installed.
- The `UPDATE` has both key bounds and the predicate, and no `LIMIT`.

---

## Phase 3: Rehearse and Verify

### Entry Criteria
- Script written; scratch server ready.

### Actions
1. Run against the scratch server with `BATCH_SIZE` = `batch_size`. Save the log.
2. If any `seconds=` exceeds `max_batch_seconds`, stop, halve `BATCH_SIZE`, resume with `START_ID`. Record each size.
3. Watch replica lag from another session on each replica: `SHOW REPLICA STATUS\G` (8.0.22+) field `Seconds_Behind_Source`; older servers use `SHOW SLAVE STATUS\G` field `Seconds_Behind_Master`. In production, pause when lag exceeds the owner's limit.
4. Watch lock waits: `SELECT * FROM sys.innodb_lock_waits\G` should stay empty or brief.
5. Verify: `SELECT COUNT(*) FROM <table> WHERE <predicate>;` returns 0. If the plan expects equality: `SELECT COUNT(*) FROM <table> WHERE NOT (<target> <=> <source>);` returns 0 (`<=>` is MySQL's NULL-safe equality).
6. Run `ANALYZE TABLE <table>;` to refresh statistics.
7. Write production run instructions: option file, environment variables, `tmux`, resume procedure, lag limit.

### Output
`backfill_report`.

### Quality Gate
- Verification returns 0, with output recorded.
- No batch in the final run exceeded `max_batch_seconds`.

---

## Common Mistakes To Avoid

- Do not run one `UPDATE` over the whole table; it creates one huge transaction, a long undo log, and replica lag.
- Do not put the password on the command line; it appears in `ps` output.
- Do not page with a growing `OFFSET` from the start of the table.
- Do not start before every app instance dual-writes.

---

## Worked Example

Illustrative only. Spec: table `customer`, key `id`, target `full_name`, source `name`, predicate `full_name IS NULL AND name IS NOT NULL`. `batch_size` 2000.

Phase 1: pre-count 803,112; `@@binlog_format` = ROW; no triggers.

Phase 3 log excerpt:
```
2026-10-20T15:10:01+00:00 lo=0 hi=2000 updated=2000 seconds=.28
2026-10-20T15:10:02+00:00 lo=2000 hi=4013 updated=1997 seconds=.27
...
```
`Seconds_Behind_Source` stayed at 0 on the scratch replica. Verification `SELECT COUNT(*) FROM customer WHERE full_name IS NULL AND name IS NOT NULL;` returns 0.

---

## Exit Criteria

DONE when the script commits per range, resumes from `START_ID`, stays under `max_batch_seconds` in rehearsal, and verification returns 0.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `backfill_specs` is empty | **Return**: emit an empty `backfill_script` and a `backfill_report` stating no data steps exist. |
| Phase 1 | `binlog_format` is `STATEMENT` or `MIXED` | **Adjust**: keep the default isolation level; record that gap locks may block inserts near the range end. |
| Phase 2 | Key is not numeric or binary-ordered | **Return**: ask for an ordered unique key; do not batch on a non-unique column. |
| Phase 3 | Error 1205 lock wait timeout | **Retry**: resume with `START_ID`; if it repeats, find the blocker in `sys.innodb_lock_waits`. |
| Phase 3 | Verification returns rows | **Retry**: rerun from 0; if rows remain, fix the app dual-write. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
