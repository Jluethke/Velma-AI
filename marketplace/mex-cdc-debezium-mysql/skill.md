# MySQL Change Data Capture with Debezium

**One-line description:** Verifies the MySQL binary log is row-based with full row images and long enough retention, creates a least-privilege Debezium user, deploys the Debezium MySQL connector with a unique `database.server.id` and a schema history topic, and verifies snapshot and streaming events for the candidate's tables.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `schema_split_plan` (object, required): From `mex-schema-ownership-split`; names the database and tables to capture.
- `sync_strategy` (string, required): Must be `cdc`.

---

## Outputs

- `mysql_cdc_pipeline` (object): Binlog settings verified, retention value and its source, Debezium user grants, connector name and config (secrets redacted), `database.server.id` chosen, schema history topic, topic names, and event check results.

---

## Phase 1: Verify Binlog Settings

### Entry Criteria
- `database_engine` is `mysql`, `sync_strategy` is `cdc`.

### Actions
1. Read the settings:
   ```sql
   SHOW VARIABLES WHERE Variable_name IN
     ('log_bin','binlog_format','binlog_row_image','server_id','gtid_mode','enforce_gtid_consistency','binlog_expire_logs_seconds','binlog_row_metadata');
   SELECT VERSION();
   ```
2. Required by the Debezium MySQL connector docs: `log_bin` = `ON`, `binlog_format` = `ROW`, `binlog_row_image` = `FULL`. GTID mode (`gtid_mode=ON`, `enforce_gtid_consistency=ON`) is recommended so the connector can follow a failover. If a value differs, the user or DBA changes it (managed services: Amazon RDS needs automated backups enabled for binlogs and binlog retention set with `CALL mysql.rds_set_configuration('binlog retention hours', <n>);`; check your provider's docs).
3. Retention must exceed the longest time the connector could be down plus the snapshot duration, or the connector loses its position and must re-snapshot. Ask the user for that outage window; record the setting and its source.
4. Current position for the record: `SHOW BINARY LOG STATUS;` (MySQL 8.2 and later) or `SHOW MASTER STATUS;` (earlier versions).

### Output
Verified binlog settings.

### Quality Gate
- The query output shows `binlog_format=ROW` and `binlog_row_image=FULL` and `log_bin=ON`.

---

## Phase 2: User and Connector

### Entry Criteria
- Binlog settings verified.
- Kafka Connect has the plugin: `curl -s $CONNECT/connector-plugins | jq -r '.[].class' | grep MySqlConnector`.

### Actions
1. Create the user with the grants listed in the Debezium MySQL docs:
   ```sql
   CREATE USER 'dbz_billing'@'%' IDENTIFIED BY '<from secret store>';
   GRANT SELECT, RELOAD, SHOW DATABASES, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'dbz_billing'@'%';
   ```
   `RELOAD` is used for snapshot locking; if the DBA refuses it, read the `snapshot.locking.mode` section of the docs for the options available in your version.
2. Choose `database.server.id`: a number unique among every replica and binlog client of this MySQL server. List existing ones with `SHOW REPLICAS;` (`SHOW SLAVE HOSTS;` before 8.0.22) and pick one not in use. Two clients with the same ID disconnect each other.
3. Connector config (Debezium 2.x names):
   ```json
   {"name": "billing-mysql-cdc",
    "config": {
      "connector.class": "io.debezium.connector.mysql.MySqlConnector",
      "database.hostname": "mysql.internal", "database.port": "3306",
      "database.user": "dbz_billing", "database.password": "${file:/secrets/dbz.properties:password}",
      "database.server.id": "<unique id>",
      "topic.prefix": "shop",
      "database.include.list": "billing",
      "table.include.list": "billing.invoices,billing.invoice_lines,billing.payments",
      "schema.history.internal.kafka.bootstrap.servers": "kafka:9092",
      "schema.history.internal.kafka.topic": "schemahistory.shop",
      "snapshot.mode": "initial",
      "include.schema.changes": "false"
    }}
   ```
   The schema history topic must have infinite retention and one partition, as the docs require; create it in advance with those settings rather than letting the broker auto-create it with defaults.
4. Create and check: `curl -s -X POST -H "Content-Type: application/json" --data @billing-mysql-cdc.json $CONNECT/connectors` then `curl -s $CONNECT/connectors/billing-mysql-cdc/status | jq`.

### Output
Running connector.

### Quality Gate
- Connector and all tasks report `RUNNING`.
- `kafka-topics.sh --describe --topic schemahistory.shop --bootstrap-server kafka:9092` shows `PartitionCount: 1` and `retention.ms=-1` in its configs.

---

## Phase 3: Verify Events

### Entry Criteria
- Connector running.

### Actions
1. Compare snapshot counts per table (`SELECT COUNT(*) FROM billing.invoices;`) with record counts on `shop.billing.invoices` (snapshot records have `op` `r`).
2. In a non-production environment, insert, update and delete one row and confirm `c`, `u`, `d` events with correct `before` and `after`.
3. DDL: test one `ALTER TABLE ... ADD COLUMN` on a captured table in non-production and confirm the connector continues and new events contain the column.
4. Record the teardown procedure: delete the connector with `curl -X DELETE`; drop the user; delete the schema history topic only after the connector is gone.

### Output
`mysql_cdc_pipeline`.

### Quality Gate
- Topic counts after snapshot equal table counts.
- Streaming test shows `c`, `u`, `d` for the test row.

---

## Worked Example

Illustrative. MySQL 8.0.36 on a VM.

```
mysql> SHOW VARIABLES WHERE Variable_name IN ('log_bin','binlog_format','binlog_row_image');
log_bin ON | binlog_format ROW | binlog_row_image FULL
mysql> SHOW REPLICAS;
Server_Id 2, Server_Id 3
```
Chosen `database.server.id = 184054` (not in use). Status `RUNNING`. Snapshot: `billing.invoices` 98,764 rows, topic 98,764 `r` events. Test update produced `{"op":"u","before":{"status":"N"},"after":{"status":"P"}}`.

---

## Exit Criteria

DONE when binlog settings meet the connector's documented requirements, the connector streams the candidate's tables with a unique server ID and a correctly configured schema history topic, and snapshot and streaming events are verified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `binlog_format` is `STATEMENT` or `MIXED` | **Stop**: the user changes it to `ROW`; existing replicas may be affected, so coordinate with the DBA. |
| Phase 2 | Task fails with `A replica with the same server_uuid/server_id ...` | **Adjust**: choose another `database.server.id`. |
| Phase 2 | Task fails because the binlog position was purged | **Retry**: retention was too short; increase it and re-snapshot following the docs for `snapshot.mode`. |
| Phase 3 | Schema history topic was auto-created with deletion retention | **Stop**: recreate it correctly before history is lost; follow the docs' recovery steps. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
