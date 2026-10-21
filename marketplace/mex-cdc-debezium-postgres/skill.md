# PostgreSQL Change Data Capture with Debezium

**One-line description:** Configures PostgreSQL logical decoding (`wal_level=logical`, a publication, a dedicated replication user) and a Debezium PostgreSQL connector on Kafka Connect using the built-in `pgoutput` plugin, limited to the candidate's tables, then verifies snapshot and streaming events and sets up monitoring of replication slot WAL retention so an idle slot cannot fill the disk.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `schema_split_plan` (object, required): From `mex-schema-ownership-split`; names the tables to capture.
- `sync_strategy` (string, required): Must be `cdc`.

---

## Outputs

- `pg_cdc_pipeline` (object): Server settings changed, replication user, publication and slot names, connector name and full config (secrets redacted), topic names, the snapshot mode, the event check results, and the slot lag monitoring query and alert owner.

---

## Phase 1: Prepare PostgreSQL

### Entry Criteria
- `database_engine` is `postgres`, `sync_strategy` is `cdc`.
- You have a DBA or the user's approval for a server parameter change; `wal_level` needs a restart.

### Actions
1. Check current settings: `SHOW wal_level; SHOW max_replication_slots; SHOW max_wal_senders; SELECT version();`.
2. If `wal_level` is not `logical`, the user must set it (`ALTER SYSTEM SET wal_level = logical;` then restart, or the managed provider's parameter: for example Amazon RDS `rds.logical_replication = 1` in the parameter group; Cloud SQL `cloudsql.logical_decoding = on`; check the provider docs). Do not restart a production server yourself.
3. Create a replication user with only what Debezium needs:
   ```sql
   CREATE ROLE dbz_billing WITH LOGIN REPLICATION;  -- password from the secret store
   GRANT USAGE ON SCHEMA billing TO dbz_billing;
   GRANT SELECT ON billing.invoices, billing.invoice_lines, billing.payments TO dbz_billing;
   ```
   On RDS, grant `rds_replication` instead of the `REPLICATION` attribute.
4. Create the publication yourself so Debezium does not need table ownership: `CREATE PUBLICATION dbz_billing FOR TABLE billing.invoices, billing.invoice_lines, billing.payments;`
5. Check replica identity: tables without a primary key emit updates and deletes without a usable key. `SELECT relname, relreplident FROM pg_class WHERE oid IN ('billing.invoices'::regclass, 'billing.payments'::regclass);` (`d` = default, uses the primary key). If a consumer needs full before-images of every column, set `ALTER TABLE billing.invoices REPLICA IDENTITY FULL;` and note the extra WAL volume.

### Output
Logical decoding enabled, user and publication created.

### Quality Gate
- `SHOW wal_level;` prints `logical`.
- `SELECT pubname FROM pg_publication;` lists `dbz_billing` and `SELECT * FROM pg_publication_tables WHERE pubname='dbz_billing';` lists exactly the intended tables.

---

## Phase 2: Deploy the Connector

### Entry Criteria
- Kafka Connect cluster with the Debezium PostgreSQL connector plugin installed: `curl -s $CONNECT/connector-plugins | jq -r '.[].class' | grep PostgresConnector` prints the class.

### Actions
1. Write `billing-pg-cdc.json` (Debezium 2.x property names; check the docs for your version):
   ```json
   {"name": "billing-pg-cdc",
    "config": {
      "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
      "plugin.name": "pgoutput",
      "database.hostname": "db.internal", "database.port": "5432",
      "database.user": "dbz_billing", "database.password": "${file:/secrets/dbz.properties:password}",
      "database.dbname": "shop",
      "topic.prefix": "shop",
      "slot.name": "dbz_billing",
      "publication.name": "dbz_billing",
      "publication.autocreate.mode": "disabled",
      "table.include.list": "billing.invoices,billing.invoice_lines,billing.payments",
      "snapshot.mode": "initial",
      "heartbeat.interval.ms": "<user value>"
    }}
   ```
   Keep passwords out of the file with a Kafka Connect config provider as shown, or the platform's secret mechanism.
2. Create it: `curl -s -X POST -H "Content-Type: application/json" --data @billing-pg-cdc.json $CONNECT/connectors`.
3. Check status: `curl -s $CONNECT/connectors/billing-pg-cdc/status | jq`. Connector and task `state` must be `RUNNING`; a `FAILED` task includes a `trace` with the cause.
4. Topics follow `<topic.prefix>.<schema>.<table>`, for example `shop.billing.invoices`.
5. `heartbeat.interval.ms`: on a database where captured tables are quiet but others are busy, the slot's confirmed position does not advance without heartbeats, and WAL piles up. Set a value with the user and record it.

### Output
Running connector.

### Quality Gate
- Status JSON shows `"state": "RUNNING"` for the connector and every task.
- `SELECT slot_name, plugin, active FROM pg_replication_slots WHERE slot_name='dbz_billing';` shows `pgoutput` and `t`.

---

## Phase 3: Verify Events and Monitor the Slot

### Entry Criteria
- Connector running.

### Actions
1. Snapshot: count records on each topic after the snapshot and compare with `SELECT COUNT(*)` per table. Snapshot events have `op = "r"`.
2. Streaming: insert, update and delete one test row in a non-production environment; read the topic and confirm `op` values `c`, `u`, `d` with `before` and `after` as expected, and a tombstone after the delete (default `tombstones.on.delete` is true).
3. Slot lag query for monitoring:
   ```sql
   SELECT slot_name, active, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)) AS retained
   FROM pg_replication_slots WHERE slot_name = 'dbz_billing';
   ```
   Alert when retained WAL grows continuously or `active` is false. On PostgreSQL 13+, `max_slot_wal_keep_size` caps retention (the slot is invalidated past it, forcing a new snapshot); choose it with the DBA.
4. Schema changes: altering a captured table changes event shape. Add new nullable columns only; tell consumers before renames or drops.
5. Teardown procedure for later (record, do not run now): delete connector `curl -X DELETE $CONNECT/connectors/billing-pg-cdc`, then `SELECT pg_drop_replication_slot('dbz_billing');` and `DROP PUBLICATION dbz_billing;`. A connector deleted without dropping its slot keeps WAL forever.

### Output
`pg_cdc_pipeline`.

### Quality Gate
- Topic record counts after snapshot equal table counts.
- Streaming test shows `c`, `u`, `d` events for the test row.
- The slot lag query is in the monitoring system with a named owner.

---

## Worked Example

Illustrative.

```
$ curl -s $CONNECT/connectors/billing-pg-cdc/status | jq -c '{c:.connector.state,t:[.tasks[].state]}'
{"c":"RUNNING","t":["RUNNING"]}
$ psql "$DB" -c "SELECT slot_name, active, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)) FROM pg_replication_slots;"
 dbz_billing | t | 312 kB
$ kcat -b $BROKER -t shop.billing.invoices -C -o -1 -c 1 -e | jq -c '{op:.payload.op, id:.payload.after.id}'
{"op":"u","id":"INV-20391"}
```
Snapshot: `invoices` 98,764 rows, topic 98,764 `r` events.

---

## Exit Criteria

DONE when the connector streams the candidate's tables with matching snapshot counts, streaming events are verified for create, update and delete, and slot WAL retention is monitored with a teardown procedure recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cannot change `wal_level` (managed service limits) | **Return**: report to `mex-dual-write-or-cdc-decision`; choose `outbox`. |
| Phase 2 | Task FAILED with `permission denied for table` | **Adjust**: grant `SELECT` on that table to the replication user. |
| Phase 2 | `replication slot "dbz_billing" already exists` | **Stop**: another consumer may own it; check `pg_replication_slots.active_pid` before dropping anything. |
| Phase 3 | Retained WAL keeps growing | **Retry**: check connector status and heartbeats; if the connector is gone, drop the slot with the DBA. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
