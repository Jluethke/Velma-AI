# SQL Tuning Baseline and Scope

**One-line description:** Records the exact database engine, version, non-default settings, table sizes, environment class and acceptance criteria before any tuning starts, so every later step compares against a captured baseline and never runs a write-capable diagnostic on the wrong server.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `db_engine` (string, required): `postgresql` or `mysql`. Every later flow branches on this value.
- `db_version` (string, optional): Version the user believes is running. Phase 1 replaces it with the server's own answer.
- `stack` (string, required): Application language: `python`, `node`, `ruby`, `java` or `go`.
- `orm` (string, optional): ORM in use: `django`, `sqlalchemy`, `rails`, `prisma`, `hibernate`, `gorm`, or `none`.
- `symptom` (string, required): What the user observed, in their words (for example "checkout API p95 went from 120 ms to 900 ms after the orders table passed 40M rows").
- `target_environment` (object, required): Host, port, database name, read-only or read-write role, and whether the server is a production primary, a replica, a restored snapshot, or a dev database.
- `acceptance_criteria` (object, optional): The user's numeric targets, for example target p95 latency for a named query and the largest write throughput loss they accept from a new index.

---

## Outputs

- `tuning_scope` (object): Engine, server-reported version, environment class, allowed actions per environment, non-default settings snapshot, table sizes for the tables in scope, `stack`, `orm`, the `symptom`, the acceptance criteria, and the list of open questions.

---

## Phase 1: Identify the Server

### Entry Criteria
- `db_engine` is `postgresql` or `mysql`.
- `target_environment` has host, port and database name.

### Actions
1. Connect with a read-only role where one exists. PostgreSQL: `psql "host=HOST port=PORT dbname=DB user=RO_USER" -X`. MySQL: `mysql -h HOST -P PORT -u RO_USER -p DB`.
2. Record the version from the server, not from memory:
   - PostgreSQL: `SELECT version();` and `SHOW server_version_num;`
   - MySQL: `SELECT @@version, @@version_comment;`
3. Record whether the server is a primary or a replica:
   - PostgreSQL: `SELECT pg_is_in_recovery();` (`t` means replica).
   - MySQL 8.0.22 and later: `SHOW REPLICA STATUS\G`; older: `SHOW SLAVE STATUS\G`. Empty output means it is not a replica. Also record `SELECT @@read_only, @@super_read_only;`.
4. Record the managed service if any (Amazon RDS, Aurora, Cloud SQL, Azure Database). On managed services, settings change through the provider's parameter group or flags, not `ALTER SYSTEM` or `my.cnf`.

### Output
Engine, exact version and role recorded.

### Quality Gate
- `tuning_scope.version` holds the literal string returned by `SELECT version();` or `SELECT @@version;`.
- `tuning_scope.is_replica` was set from `pg_is_in_recovery()` or the replica status command output, not assumed.

---

## Phase 2: Snapshot Settings and Sizes

### Entry Criteria
- Phase 1 complete.

### Actions
1. Capture non-default settings.
   - PostgreSQL: `SELECT name, setting, unit, source FROM pg_settings WHERE source NOT IN ('default','override') ORDER BY name;`
   - MySQL: `SELECT * FROM performance_schema.global_variables WHERE VARIABLE_NAME IN ('innodb_buffer_pool_size','long_query_time','slow_query_log','performance_schema','transaction_isolation','innodb_lock_wait_timeout','lock_wait_timeout','max_connections','innodb_stats_persistent','innodb_stats_persistent_sample_pages');`
2. Capture these planner-relevant settings explicitly, even when default. PostgreSQL: `work_mem`, `random_page_cost`, `effective_cache_size`, `shared_buffers`, `default_statistics_target`, `jit`, `plan_cache_mode`, `max_connections`, `shared_preload_libraries`. MySQL: `optimizer_switch`, `eq_range_index_dive_limit`, `innodb_buffer_pool_size`.
3. Capture the size of every table named in the `symptom` or later found in the slow query list.
   - PostgreSQL: `SELECT relname, reltuples::bigint, pg_size_pretty(pg_total_relation_size(oid)) FROM pg_class WHERE relkind IN ('r','p') ORDER BY pg_total_relation_size(oid) DESC LIMIT 20;`
   - MySQL: `SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY DATA_LENGTH + INDEX_LENGTH DESC LIMIT 20;` (`TABLE_ROWS` is an estimate for InnoDB.)
4. Save the outputs verbatim in `tuning_scope.settings_snapshot` and `tuning_scope.table_sizes`.

### Output
Settings snapshot and table sizes.

### Quality Gate
- Every planner-relevant setting listed in Action 2 has a recorded value.
- The settings snapshot is the raw query output, not a summary.

---

## Phase 3: Classify Environment and Set Allowed Actions

### Entry Criteria
- Phase 2 complete.

### Actions
1. Classify the environment with this table:

| Evidence | Class |
|---|---|
| Primary, serves live traffic | `production_primary` |
| Replica of production | `production_replica` |
| Restored from a production snapshot or `pg_dump`/`mysqldump` of production, same major version | `production_like` |
| Seeded, synthetic or small dataset | `dev` |

2. Set allowed actions from this table. Later flows read it and must not exceed it.

| Action | production_primary | production_replica | production_like | dev |
|---|---|---|---|---|
| Read catalog views, `EXPLAIN` without ANALYZE | yes | yes | yes | yes |
| `EXPLAIN ANALYZE` of SELECT | yes, one run per query, with `statement_timeout` / `max_execution_time` set | yes | yes | yes |
| `EXPLAIN ANALYZE` of INSERT/UPDATE/DELETE | only inside `BEGIN; ... ROLLBACK;` on PostgreSQL; never on MySQL | no (read-only) | yes, inside a transaction | yes |
| Create or drop an index | only through the online index flows, with user approval | no | yes | yes |
| Benchmarks (`pgbench`, `mysqlslap`, `sysbench`) | no | no | yes | yes, but results do not count as verification |

3. Copy `acceptance_criteria` into the scope. If it is missing or has no number for latency or for allowed write loss, add each missing number to `tuning_scope.open_questions`. Do not invent a target.
4. Record `stack`, `orm` and `symptom` unchanged.

### Output
`tuning_scope`.

### Quality Gate
- `tuning_scope.environment_class` is one of the four classes in the table.
- `tuning_scope.open_questions` lists every acceptance number the user did not supply, or is empty.

---

## Worked Example

Illustrative only.

Input: `db_engine` = `postgresql`, `stack` = `python`, `orm` = `django`, `symptom` = "GET /orders p95 rose from 120 ms to 900 ms", `target_environment` = staging host restored nightly from production.

Phase 1:
```
$ psql "host=staging-db port=5432 dbname=shop user=tuning_ro" -X -c "SELECT version();" -c "SELECT pg_is_in_recovery();"
 PostgreSQL 16.4 on x86_64-pc-linux-gnu, compiled by gcc 12.2.0, 64-bit
 pg_is_in_recovery
 f
```
Phase 2: `work_mem = 4MB` (default), `random_page_cost = 4` (default), `shared_preload_libraries = pg_stat_statements`, `orders` reltuples 41,203,118, 18 GB total.

Phase 3: `environment_class` = `production_like`. `acceptance_criteria` gave p95 target 150 ms but no write loss limit, so `open_questions` = ["largest acceptable write throughput loss on orders from a new index"].

---

## Exit Criteria

DONE when `tuning_scope` holds the server-reported version, role, environment class, allowed-actions table, settings snapshot, table sizes, and open questions.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cannot connect | **Stop**: report the exact client error text; do not guess the version. |
| Phase 1 | Only a superuser or admin account is offered | **Adjust**: proceed, but record in `tuning_scope` that every later command must be read-only unless a flow says otherwise. |
| Phase 2 | `pg_settings` or `performance_schema` not readable | **Adjust**: use `SHOW ALL;` (PostgreSQL) or `SHOW GLOBAL VARIABLES;` (MySQL) and save the raw output. |
| Phase 3 | Environment class unclear | **Return**: ask the user which class applies; treat it as `production_primary` until answered. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
