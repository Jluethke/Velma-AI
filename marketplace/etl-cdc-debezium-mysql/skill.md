# ETL CDC with Debezium for MySQL

**One-line description:** Sets up change data capture from MySQL 8 binlogs with the Debezium MySQL connector on Kafka Connect: row-based binlog with full row images, GTID mode, a unique `database.server.id`, a correctly retained schema history topic, and a binlog retention check so the connector never falls behind a purged log.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_connection` (object, required): MySQL host, port, and a capture user the DBA can grant replication privileges.
- `data_contract` (object, required): Output of `etl-target-schema-contract`; names the tables to capture.
- `project_dir` (string, required): Repository root; connector config goes in `<project_dir>/cdc/`.

---

## Outputs

- `cdc_connector_config` (string): Path to `cdc/<connector-name>.json`.
- `cdc_topics` (string[]): Data topics `<topic.prefix>.<database>.<table>` plus the schema history topic name, with one verified sample event per `op` type.

---

## Phase 1: Check the Binlog Settings

### Entry Criteria
- MySQL 8.0 or later (`SELECT VERSION();`). For 5.7 read the Debezium docs for your connector version first.

### Actions
1. Run and record:
   ```sql
   SHOW VARIABLES WHERE Variable_name IN
     ('log_bin','binlog_format','binlog_row_image','gtid_mode','enforce_gtid_consistency',
      'server_id','binlog_expire_logs_seconds');
   ```
2. Required values (8.0 defaults in parentheses): `log_bin = ON` (ON), `binlog_format = ROW` (ROW), `binlog_row_image = FULL` (FULL). `MINIMAL` or `NOBLOB` images produce partial `after` records; reject them for CDC into a merge.
3. GTID: `gtid_mode = ON` and `enforce_gtid_consistency = ON` let the connector resume on a different replica after failover. If off, record the risk; enabling GTID is a staged DBA change, not something this flow does.
4. Retention: `binlog_expire_logs_seconds` must be longer than the longest outage the connector can have. On Amazon RDS read it with `CALL mysql.rds_show_configuration;` and set `binlog retention hours` with `CALL mysql.rds_set_configuration('binlog retention hours', <hours>);`; RDS defaults to purging quickly when this is NULL. The number is the DBA's decision.
5. Create the capture user with the grants the Debezium MySQL docs list:
   ```sql
   CREATE USER 'debezium'@'%' IDENTIFIED BY '<from secret store>';
   GRANT SELECT, RELOAD, SHOW DATABASES, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'debezium'@'%';
   ```
   If the snapshot cannot take a global read lock (managed services often forbid `FLUSH TABLES WITH READ LOCK`), the connector falls back to table locks and also needs `LOCK TABLES`.

### Output
Recorded settings and capture user.

### Quality Gate
- The `SHOW VARIABLES` output shows `ROW`, `FULL`, `ON` for log_bin, saved to `cdc/mysql_settings.txt`.

---

## Phase 2: Deploy the Connector

### Entry Criteria
- `curl -s localhost:8083/connector-plugins | jq '.[].class'` includes `io.debezium.connector.mysql.MySqlConnector`.

### Actions
1. Write `cdc/orders-mysql.json` (Debezium 2.x names; 1.x used `database.server.name` and `database.history.kafka.*`; confirm against your version's docs):
   ```json
   {
     "connector.class": "io.debezium.connector.mysql.MySqlConnector",
     "database.hostname": "mysql1",
     "database.port": "3306",
     "database.user": "debezium",
     "database.password": "${file:/opt/connect/secrets.properties:mysql_password}",
     "database.server.id": "<unique integer, not used by any MySQL server or other connector>",
     "topic.prefix": "shop",
     "database.include.list": "sales",
     "table.include.list": "sales.orders",
     "schema.history.internal.kafka.bootstrap.servers": "broker:9092",
     "schema.history.internal.kafka.topic": "schema-history.shop",
     "snapshot.mode": "initial",
     "decimal.handling.mode": "string",
     "tombstones.on.delete": "true"
   }
   ```
2. The schema history topic must be single-partition with unlimited retention, or the connector cannot restart after DDL. Create it explicitly:
   ```bash
   kafka-topics.sh --bootstrap-server broker:9092 --create --topic schema-history.shop \
     --partitions 1 --replication-factor <cluster value> --config retention.ms=-1 --config retention.bytes=-1
   ```
3. Deploy: `curl -s -X PUT -H "Content-Type: application/json" --data @cdc/orders-mysql.json localhost:8083/connectors/orders-mysql/config | jq .`
4. Status: `curl -s localhost:8083/connectors/orders-mysql/status | jq '.connector.state, .tasks[].state'` must print `"RUNNING"` twice.
5. Never reuse a `database.server.id` between two connectors; MySQL disconnects one of the two replicas with the same id and the connectors flap.

### Output
`cdc_connector_config` deployed.

### Quality Gate
- `kafka-topics.sh --describe --topic schema-history.shop` shows `PartitionCount: 1` and `retention.ms=-1`.
- Status prints RUNNING for connector and task.

---

## Phase 3: Verify Events and Binlog Position

### Entry Criteria
- Snapshot finished (connector log shows the snapshot completed).

### Actions
1. With approval, insert, update and delete a test row, then:
   ```bash
   kcat -C -b broker:9092 -t shop.sales.orders -o -4 -e | jq -c 'select(. != null) | {op:.payload.op, file:.payload.source.file, pos:.payload.source.pos, gtid:.payload.source.gtid}'
   ```
2. Expect `c`, `u` (with a non-null `before`, because row image is FULL), `d`, then a tombstone.
3. Compare the connector position with the server: on MySQL 8.0 `SHOW MASTER STATUS;`, on 8.4 and later `SHOW BINARY LOG STATUS;`. The connector's `source.file` should be the current or a recent binlog file.
4. List retained binlogs (`SHOW BINARY LOGS;`) and record the oldest file. If the connector's offset ever points to a file older than it, the connector fails and must re-snapshot; alert on connector task state.

### Output
`cdc_topics` with sample events.

### Quality Gate
- `kcat` shows `c`, `u`, `d` for the test row and the `u` event has non-null `before`.

---

## Worked Example

Illustrative.
```
mysql> SHOW VARIABLES WHERE Variable_name IN ('binlog_format','binlog_row_image','gtid_mode');
| binlog_format    | ROW  |
| binlog_row_image | FULL |
| gtid_mode        | ON   |
$ kcat -C -b broker:9092 -t shop.sales.orders -o -4 -e | jq -c 'select(. != null) | {op:.payload.op, file:.payload.source.file}'
{"op":"c","file":"binlog.000412"}
{"op":"u","file":"binlog.000412"}
{"op":"d","file":"binlog.000412"}
mysql> SHOW MASTER STATUS;
| binlog.000412 | 88213901 | ...
```

---

## Exit Criteria

DONE when binlog settings are recorded as ROW/FULL, the schema history topic is single-partition with unlimited retention, the connector is RUNNING, and test-row events read back with full before-images.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `binlog_row_image` is not FULL | **Stop**: the DBA must change it; partial images corrupt merges. |
| Phase 2 | Error `The db history topic is missing` on restart | **Adjust**: the topic was deleted or compacted away; set `snapshot.mode` per the docs for history recovery, or re-snapshot. |
| Phase 2 | Error about server id already in use | **Adjust**: pick a different `database.server.id`, redeploy. |
| Phase 3 | Error that the binlog position is no longer available | **Return**: binlogs were purged; increase retention with the DBA and run a new snapshot. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
