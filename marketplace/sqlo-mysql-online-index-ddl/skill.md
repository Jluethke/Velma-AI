# MySQL Online Index DDL Rollout

**One-line description:** Adds approved indexes to a live MySQL table with `ALGORITHM=INPLACE, LOCK=NONE` or with gh-ost / pt-online-schema-change when replica lag or table size requires it, guards the metadata lock with `lock_wait_timeout`, tracks progress through performance_schema stage events, and uses invisible indexes for a reversible cutover.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuning_scope` (object, required): From `sqlo-baseline-scope`.
- `approved_indexes` (object[], required): From `sqlo-index-write-cost`.
- `migration_tool` (string, required): `raw_sql`, `gh-ost`, `pt-online-schema-change`, or the app's migration framework (`rails`, `django`, `flyway`, `liquibase`, `knex`, `prisma`).

---

## Outputs

- `index_migration` (object[]): Per index: method used, exact command, start and end time, replica lag observed, visibility state, dropped redundant indexes with saved definitions, and rollback statements.

---

## Phase 1: Choose the Method

### Entry Criteria
- `tuning_scope.db_engine` == `mysql`.
- `approved_indexes` is not empty.

### Actions
1. Record: `SELECT @@version, @@binlog_format, @@innodb_online_alter_log_max_size, @@lock_wait_timeout;` (`innodb_online_alter_log_max_size` default 128 MB; `lock_wait_timeout` default 31536000 seconds).
2. Choose:

| Situation | Method |
|---|---|
| Replicas exist and the user cannot accept replica lag for the build duration (native ALTER replays on replicas after it finishes on the primary, single-threaded per table) | `gh-ost` (needs `binlog_format=ROW`) or `pt-online-schema-change` (trigger based) |
| Table has heavy writes during the build and the online log could exceed `innodb_online_alter_log_max_size` | `gh-ost` or `pt-online-schema-change`, or raise the log size with the user |
| Table has triggers already | `gh-ost` (pt-osc adds triggers; check `--help` for its trigger handling on your version) |
| Amazon Aurora or RDS, no replicas or lag acceptable | native `ALTER TABLE ... ALGORITHM=INPLACE, LOCK=NONE` |
| Otherwise | native |

3. For the app's migration framework, emit the native statement as raw SQL inside the migration so `ALGORITHM` and `LOCK` clauses are kept.

### Output
Method chosen with reason.

### Quality Gate
- The method choice cites the table row and the recorded settings.

---

## Phase 2: Run the Build

### Entry Criteria
- User approved the run time.

### Actions
1. Native:
```
SET SESSION lock_wait_timeout = <user value>;
ALTER TABLE products ADD INDEX idx_cat_price_name (category_id, price, name) INVISIBLE, ALGORITHM=INPLACE, LOCK=NONE;
```
   With explicit `ALGORITHM=INPLACE, LOCK=NONE`, MySQL returns an error instead of silently falling back to a blocking copy. The ALTER takes an exclusive metadata lock briefly at start and end; if a long transaction holds a metadata lock on the table, the ALTER waits and every new query on the table queues behind it. `lock_wait_timeout` bounds that wait.
2. Before running, check open transactions: `SELECT trx_mysql_thread_id, trx_started FROM information_schema.INNODB_TRX ORDER BY trx_started LIMIT 5;`
3. Progress (native): enable once, then read:
```
UPDATE performance_schema.setup_instruments SET ENABLED = 'YES', TIMED = 'YES' WHERE NAME LIKE 'stage/innodb/alter%';
UPDATE performance_schema.setup_consumers SET ENABLED = 'YES' WHERE NAME LIKE 'events_stages_%';
SELECT EVENT_NAME, WORK_COMPLETED, WORK_ESTIMATED FROM performance_schema.events_stages_current;
```
4. gh-ost (dry run first, without `--execute`):
```
gh-ost --host=replica1 --database=shop --table=products \
  --alter="ADD INDEX idx_cat_price_name (category_id, price, name)" \
  --max-lag-millis=<user value> --chunk-size=<user value> \
  --postpone-cut-over-flag-file=/tmp/ghost.postpone --verbose
```
   Add `--execute` for the real run. gh-ost has more required or relevant flags for your topology (for example connecting through a replica vs `--allow-on-master`); confirm with `gh-ost --help` and its docs.
5. pt-online-schema-change: `pt-online-schema-change --alter "ADD INDEX idx_cat_price_name (category_id, price, name)" D=shop,t=products --dry-run`, then `--execute`. Read `--max-lag` and `--chunk-time` in `--help` before setting them.
6. Watch replica lag during the build: `SHOW REPLICA STATUS\G` field `Seconds_Behind_Source` (or `Seconds_Behind_Master` before 8.0.22).

### Output
Index built.

### Quality Gate
- The command output shows success (`Query OK` for native; gh-ost `Done migrating`; pt-osc `Successfully altered`).
- Replica lag readings during the build are recorded.

---

## Phase 3: Cut Over and Clean Up

### Entry Criteria
- Phase 2 succeeded.

### Actions
1. If built `INVISIBLE`, make it visible (metadata only): `ALTER TABLE products ALTER INDEX idx_cat_price_name VISIBLE;`. Rollback without a rebuild is `... INVISIBLE`.
2. Confirm use: run the target query's `EXPLAIN` and check `key`; after traffic, check `SELECT INDEX_NAME, COUNT_READ FROM performance_schema.table_io_waits_summary_by_index_usage WHERE OBJECT_NAME = 'products';`.
3. Redundant indexes marked `drop_after_build`: save `SHOW CREATE TABLE products;`, then make the old index invisible first: `ALTER TABLE products ALTER INDEX idx_category INVISIBLE;`. Watch the slow log and digest table for a period the user picks. Only then `ALTER TABLE products DROP INDEX idx_category, ALGORITHM=INPLACE, LOCK=NONE;`.
4. Write the rollback statement for each change.

### Output
`index_migration`.

### Quality Gate
- `SHOW INDEX FROM products;` lists the new index with `Visible` = `YES`.
- EXPLAIN shows the target query using it.
- Every dropped index has its definition saved and passed through an invisible period first.

---

## Worked Example

Illustrative only.

Input: approved `(category_id, price, name)` on `products` (2.1M rows), MySQL 8.0.36, one replica, user accepts lag up to the build time.

Phase 1: native method; `innodb_online_alter_log_max_size` 128 MB; write rate on `products` low.

Phase 2:
```
mysql> SET SESSION lock_wait_timeout = 10;
mysql> ALTER TABLE products ADD INDEX idx_cat_price_name (category_id, price, name) INVISIBLE, ALGORITHM=INPLACE, LOCK=NONE;
Query OK, 0 rows affected (41.27 sec)
```
Replica lag peaked at 44 s after the primary finished, then returned to 0.

Phase 3: made visible; EXPLAIN `key: idx_cat_price_name`. `idx_category` made invisible, watched for 7 days (user choice), then dropped.

---

## Exit Criteria

DONE when every approved index is built online, visible and used, redundant indexes are retired through an invisible period with definitions saved, and rollbacks exist.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `ALGORITHM=INPLACE is not supported` or `LOCK=NONE is not supported` | **Stop**: do not remove the clauses; switch to gh-ost or pt-osc. |
| Phase 2 | `Lock wait timeout exceeded` on the ALTER | **Retry**: find the open transaction in `INNODB_TRX`, wait or get approval to end it, rerun. |
| Phase 2 | `DB_ONLINE_LOG_TOO_BIG` | **Adjust**: rerun at a quieter time, raise `innodb_online_alter_log_max_size` with the user, or use gh-ost. |
| Phase 3 | Query regresses after making visible | **Adjust**: set the index `INVISIBLE` again and return to the design flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
