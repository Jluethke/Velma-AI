# PgBouncer Connection Pooling Setup and Sizing

**One-line description:** Puts PgBouncer in front of PostgreSQL with the right `pool_mode`, sizes pools against `max_connections` from measured demand, adjusts each application driver for transaction pooling (prepared statements, session state), and reads `SHOW POOLS` and `SHOW STATS` to prove clients no longer wait for connections.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuning_scope` (object, required): From `sqlo-baseline-scope`. Supplies `stack`, `max_connections` and PostgreSQL version.
- `app_connection_settings` (object, required): Per application: driver and version, pool size per instance, number of instances, and whether it uses session features (SET, LISTEN/NOTIFY, advisory locks, temp tables, WITH HOLD cursors, prepared statements).

---

## Outputs

- `pooler_config` (object): The `pgbouncer.ini` sections, driver changes per application, the pool size arithmetic, and before and after `SHOW POOLS` readings.

---

## Phase 1: Measure Connection Demand

### Entry Criteria
- `tuning_scope.db_engine` == `postgresql`.

### Actions
1. Current connections by state:
```
SELECT usename, application_name, state, count(*)
FROM pg_stat_activity WHERE backend_type = 'client backend'
GROUP BY 1,2,3 ORDER BY 4 DESC;
```
2. Record `SHOW max_connections;` (default 100) and `SHOW superuser_reserved_connections;` (default 3). Usable client slots = `max_connections - superuser_reserved_connections` minus any `reserved_connections` (PostgreSQL 16 and later).
3. Compute total app demand = sum over apps of pool size per instance x instances. Record it.
4. Record whether connections are mostly `idle`. Many idle connections plus `too many connections` errors means a pooler helps; many `active` connections at the CPU limit means a pooler alone does not.

### Output
Demand vs capacity numbers.

### Quality Gate
- Usable slots and total app demand are both computed with the formula shown.
- The state breakdown is recorded from three samples.

---

## Phase 2: Choose Pool Mode and Fix Session Features

### Entry Criteria
- Phase 1 complete.

### Actions
1. Pick `pool_mode`:

| App uses | pool_mode |
|---|---|
| LISTEN/NOTIFY, session advisory locks (`pg_advisory_lock`), temp tables across transactions, WITH HOLD cursors, session `SET` it cannot change | `session` (default; gives little multiplexing) |
| None of those, or can change them | `transaction` |
| Only single-statement autocommit queries | `statement` (rarely right; multi-statement transactions are refused) |

2. For `transaction` mode, change each session feature: `SET x = y` becomes `SET LOCAL x = y` inside the transaction; `pg_advisory_lock` becomes `pg_advisory_xact_lock`; SQL-level `PREPARE`/`EXECUTE` is not supported, remove it.
3. Protocol-level prepared statements: PgBouncer 1.21 and later supports them in transaction mode when `max_prepared_statements` is greater than 0 (check `SHOW CONFIG;` for the value and your version's docs for the default). On older PgBouncer, turn prepared statements off in the driver:

| Stack and driver | Setting |
|---|---|
| Java, PgJDBC | `prepareThreshold=0` in the JDBC URL |
| Python, psycopg 3 | `prepare_threshold=None` on the connection |
| Python, asyncpg | `statement_cache_size=0` in `connect()` / `create_pool()` |
| Node, Prisma | `?pgbouncer=true` in the connection URL |
| Ruby, Rails | `prepared_statements: false` in `database.yml` |
| Go, pgx v5 | `default_query_exec_mode=simple_protocol` (or `describe_exec`) in the connection string |
| Node, node-postgres | do not pass `name` in query config (named statements are prepared) |

4. Change one application at a time.

### Output
Pool mode chosen and driver changes listed.

### Quality Gate
- Every session feature in `app_connection_settings` has a recorded change or forces `session` mode.
- Each driver change names the exact setting from the table or the driver's docs.

---

## Phase 3: Configure and Size

### Entry Criteria
- Phase 2 complete.

### Actions
1. Write `pgbouncer.ini`:
```
[databases]
shop = host=10.0.0.5 port=5432 dbname=shop

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = <A>
default_pool_size = <B>
reserve_pool_size = <C>
max_db_connections = <D>
admin_users = pgbouncer_admin
```
   Documented defaults: `listen_port` 6432, `max_client_conn` 100, `default_pool_size` 20, `pool_mode` session.
2. Size with arithmetic, not guesses:
   - `max_client_conn` A must be at least the total app demand from Phase 1.
   - Server connections opened = `default_pool_size` x number of (database, user) pairs, plus reserve. Keep `max_db_connections` D (or the sum across pairs) below the usable slots from Phase 1, leaving room for admin, replication and migration connections the user lists.
   - Start `default_pool_size` B at the current peak of concurrently `active` server connections measured in Phase 1, then adjust from `SHOW POOLS` in Phase 4.
3. Reload: `psql -p 6432 -U pgbouncer_admin pgbouncer -c "RELOAD;"`, or restart the service the first time.
4. Point one application at port 6432 and change its own pool size so its connections to PgBouncer do not exceed A.

### Output
Running PgBouncer config.

### Quality Gate
- `SHOW CONFIG;` on the admin console returns the values written in the file.
- The sum of server-side pool limits is below usable slots, shown as arithmetic.

---

## Phase 4: Read Pool Health

### Entry Criteria
- At least one application runs through PgBouncer under normal load.

### Actions
1. `psql -p 6432 -U pgbouncer_admin pgbouncer -c "SHOW POOLS;"`. Columns: `cl_active` (clients paired with a server), `cl_waiting` (clients waiting for a server), `sv_active`, `sv_idle`, `sv_used`, `maxwait` and `maxwait_us` (longest current client wait).
2. `SHOW STATS;` gives per database `total_xact_count`, `total_query_count`, `avg_xact_time`, `avg_wait_time` (microseconds).
3. Rules:

| Reading | Meaning | Action |
|---|---|---|
| `cl_waiting` > 0 repeatedly and `maxwait` growing, server CPU has headroom | pool too small | raise `default_pool_size` within the Phase 3 limit |
| `cl_waiting` > 0 and server CPU saturated | database is the limit | do not raise the pool; tune queries |
| `sv_idle` high, `cl_waiting` 0 | pool larger than needed | leave or lower |
| `avg_xact_time` high with idle-in-transaction on the server | app holds transactions open | fix the app; see `sqlo-pg-lock-contention` |

4. Watch application logs for errors that point to transaction-mode incompatibility, for example `prepared statement "S_1" does not exist` or `prepared statement ... already exists`; these mean Phase 2 Action 3 was missed for that driver.

### Output
`pooler_config`.

### Quality Gate
- `SHOW POOLS` readings from before and after the change are recorded with timestamps.
- Application error logs for the cutover period were searched for `prepared statement` errors and the result is recorded.

---

## Worked Example

Illustrative only.

Phase 1: `max_connections` 200, reserved 3, usable 197. Demand: API 12 instances x 20 = 240; worker 4 x 10 = 40; total 280. Errors: `FATAL: sorry, too many clients already`. 81 percent of connections idle; peak active 38.

Phase 2: API uses psycopg 3 and session `SET statement_timeout`; worker uses `pg_advisory_lock`. Changes: `SET LOCAL statement_timeout`, `pg_advisory_xact_lock`. PgBouncer 1.23 with `max_prepared_statements` nonzero, so prepared statements stay on.

Phase 3: `max_client_conn = 400`, `default_pool_size = 40`, `max_db_connections = 150` (197 usable minus 47 kept for admin, replication and migrations as the user listed).

Phase 4:
```
 database | user | cl_active | cl_waiting | sv_active | sv_idle | maxwait | pool_mode
 shop     | api  |       240 |          0 |        31 |       9 |       0 | transaction
```

---

## Exit Criteria

DONE when PgBouncer runs with recorded config, every session feature is handled, server connections fit under usable slots by arithmetic, and `SHOW POOLS` shows the waiting state after cutover.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | App needs LISTEN/NOTIFY | **Adjust**: give that app a separate database entry with `pool_mode=session`, or a direct connection. |
| Phase 3 | Auth failures after cutover | **Adjust**: check `auth_type` matches the server's password hashing and `userlist.txt` holds SCRAM secrets, or use `auth_query`. |
| Phase 4 | `prepared statement ... does not exist` errors | **Return**: apply the driver setting from Phase 2 Action 3 for that app and redeploy. |
| Phase 4 | `cl_waiting` stays high with CPU saturated | **Stop**: report that pooling is not the bottleneck; continue with query tuning flows. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
