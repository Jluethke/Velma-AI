# ETL CDC with Debezium for PostgreSQL

**One-line description:** Sets up change data capture from PostgreSQL with the Debezium PostgreSQL connector on Kafka Connect using the `pgoutput` plugin, a dedicated publication and replication slot, and verifies create, update and delete events (`op` = `c`, `u`, `d`, `r`) arrive on the topic while monitoring slot WAL retention.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_connection` (object, required): PostgreSQL host, port, database, and a user the DBA can grant `REPLICATION` (or the managed-service equivalent).
- `data_contract` (object, required): Output of `etl-target-schema-contract`; its `columns[].source` names the tables to capture.
- `project_dir` (string, required): Repository root; connector config is stored in `<project_dir>/cdc/`.

---

## Outputs

- `cdc_connector_config` (string): Path to `cdc/<connector-name>.json`, the exact config PUT to Kafka Connect.
- `cdc_topics` (string[]): Topic names, `<topic.prefix>.<schema>.<table>`, with one verified sample event per `op` type.

---

## Phase 1: Prepare PostgreSQL

### Entry Criteria
- The DBA has approved logical replication on this server; changing `wal_level` requires a restart.

### Actions
1. Check settings: `SHOW wal_level; SHOW max_replication_slots; SHOW max_wal_senders;`. `wal_level` must be `logical` (default is `replica`). On Amazon RDS / Aurora set the parameter `rds.logical_replication = 1` in the parameter group; on Cloud SQL set the flag `cloudsql.logical_decoding = on`. Do not edit `postgresql.conf` on a managed service.
2. Create a capture user and grants:
   ```sql
   CREATE ROLE debezium WITH LOGIN REPLICATION PASSWORD '<from secret store>';
   GRANT USAGE ON SCHEMA sales TO debezium;
   GRANT SELECT ON sales.orders TO debezium;
   ```
3. Create the publication yourself, scoped to the captured tables, and tell Debezium not to autocreate one for all tables:
   ```sql
   CREATE PUBLICATION dbz_orders FOR TABLE sales.orders;
   ```
4. Decide replica identity with this table:
   | Need | Setting |
   |---|---|
   | Only keys on delete, after-image on update | default (primary key) |
   | Full before-image on update and delete (for audit or soft-delete reconstruction) | `ALTER TABLE sales.orders REPLICA IDENTITY FULL;` (more WAL volume) |
   | Table has no primary key | `REPLICA IDENTITY FULL` or add a key; without it updates/deletes are not published |
5. On PostgreSQL 13 and later, ask the DBA to set `max_slot_wal_keep_size` so an abandoned slot cannot fill the disk. The value is theirs to choose.

### Output
Server ready, publication `dbz_orders` created.

### Quality Gate
- `SHOW wal_level;` prints `logical`.
- `SELECT * FROM pg_publication_tables WHERE pubname = 'dbz_orders';` lists exactly the captured tables.

---

## Phase 2: Deploy the Connector

### Entry Criteria
- Kafka Connect is running with the Debezium PostgreSQL connector plugin installed: `curl -s localhost:8083/connector-plugins | jq '.[].class'` includes `io.debezium.connector.postgresql.PostgresConnector`.

### Actions
1. Write `cdc/orders-pg.json` (Debezium 2.x property names; on 1.x `topic.prefix` was `database.server.name`, so check `GET /connector-plugins` version and the docs for your version):
   ```json
   {
     "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
     "plugin.name": "pgoutput",
     "database.hostname": "db1",
     "database.port": "5432",
     "database.user": "debezium",
     "database.password": "${file:/opt/connect/secrets.properties:pg_password}",
     "database.dbname": "shop",
     "topic.prefix": "shop",
     "table.include.list": "sales.orders",
     "publication.name": "dbz_orders",
     "publication.autocreate.mode": "disabled",
     "slot.name": "dbz_orders_slot",
     "snapshot.mode": "initial",
     "decimal.handling.mode": "string",
     "tombstones.on.delete": "true",
     "heartbeat.interval.ms": "<user value>"
   }
   ```
   - `decimal.handling.mode`: default `precise` encodes `numeric` as base64 bytes, which most landing sinks mishandle; `string` keeps exact digits.
   - `heartbeat.interval.ms`: default `0` (off). Turn it on when the captured tables are quiet but the database is busy; without heartbeats the slot's confirmed LSN does not move and WAL piles up.
   - The password uses the Kafka `FileConfigProvider` syntax; never commit a literal password.
2. Deploy idempotently (PUT creates or updates): `curl -s -X PUT -H "Content-Type: application/json" --data @cdc/orders-pg.json localhost:8083/connectors/orders-pg/config | jq .`
3. Check status: `curl -s localhost:8083/connectors/orders-pg/status | jq '.connector.state, .tasks[].state'`. Both must print `"RUNNING"`. If a task is `FAILED`, read `.tasks[].trace`.

### Output
`cdc_connector_config` deployed.

### Quality Gate
- Status command prints `"RUNNING"` for the connector and every task.

---

## Phase 3: Verify Events and Slot Health

### Entry Criteria
- Connector running and the initial snapshot finished (connector log line containing `Snapshot completed`, or `snapshot_completed` in the JMX/metrics if exposed).

### Actions
1. Make one insert, one update and one delete on a test row (with the owner's approval), then read the topic:
   ```bash
   kcat -C -b broker:9092 -t shop.sales.orders -o -3 -e | jq -c '{op: .payload.op, before: .payload.before.order_id, after: .payload.after.order_id, lsn: .payload.source.lsn}'
   ```
   If the converter has `schemas.enable=false`, the envelope is at the top level: use `.op` instead of `.payload.op`.
2. Expected sequence: `c` (after set, before null), `u` (after set), `d` (before set, after null), followed by a tombstone record with a null value.
3. Check slot health:
   ```sql
   SELECT slot_name, active,
          pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)) AS retained
   FROM pg_replication_slots WHERE slot_name = 'dbz_orders_slot';
   ```
   `active` must be `t`. Add this query to monitoring; an inactive slot retains WAL until dropped.
4. Document the teardown so nobody leaves an orphan slot: `DELETE` the connector, then `SELECT pg_drop_replication_slot('dbz_orders_slot');`.

### Output
`cdc_topics` with sample events.

### Quality Gate
- `kcat` output shows one each of `c`, `u`, `d` for the test row.
- Slot query shows `active = t`.

---

## Worked Example

Illustrative.
```
$ curl -s localhost:8083/connectors/orders-pg/status | jq '.connector.state, .tasks[].state'
"RUNNING"
"RUNNING"
$ kcat -C -b broker:9092 -t shop.sales.orders -o -4 -e | jq -c '{op:.payload.op, before:.payload.before.order_id, after:.payload.after.order_id}'
{"op":"c","before":null,"after":990001}
{"op":"u","before":null,"after":990001}
{"op":"d","before":990001,"after":null}
jq: error (at <stdin>:4): Cannot index null with "payload"     <- the tombstone, expected
```
`before` on the update is null because replica identity is the default (key only on delete).

---

## Exit Criteria

DONE when the connector config is committed, the connector and tasks are RUNNING, `c`/`u`/`d` events for a test row are read back, and the slot health query is in monitoring.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | DBA will not enable logical replication | **Return**: use the watermark extract with the hard-delete key-set reconciliation instead. |
| Phase 2 | Task FAILED with `replication slot ... is active for PID` | **Stop**: another consumer holds the slot; find it in `pg_stat_replication` before doing anything. |
| Phase 2 | Task FAILED with permission denied for publication | **Adjust**: grant SELECT on the table and confirm the publication exists; rerun the PUT. |
| Phase 3 | Retained WAL grows while the connector runs | **Adjust**: enable `heartbeat.interval.ms`; confirm the sink commits offsets. |
| Phase 3 | `numeric` values arrive as base64 text | **Adjust**: set `decimal.handling.mode` to `string`, redeploy, and re-snapshot affected rows. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
