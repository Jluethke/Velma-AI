# Transactional Outbox Implementation

**One-line description:** Adds an outbox table written in the same database transaction as the business change, a relay that publishes outbox rows using `SELECT ... FOR UPDATE SKIP LOCKED` polling or the Debezium Outbox Event Router, and an idempotent consumer keyed by event ID, with a crash test proving no event is lost and duplicates are absorbed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `schema_split_plan` (object, required): From `mex-schema-ownership-split`; the writer's schema.
- `sync_strategy` (string, required): Must be `outbox` (or include an outbox stage).
- `stack` (string, required): `python`, `node`, `go` or `java`.
- `database_engine` (string, required): `postgres` or `mysql`.

---

## Outputs

- `outbox_implementation` (object): Outbox table DDL and migration path, the write helper and its call sites, the relay type (`polling` or `debezium_event_router`) and its config, the consumer dedupe table, and the crash and duplicate test results.

---

## Phase 1: Outbox Table and Write Path

### Entry Criteria
- `sync_strategy` is `outbox`.

### Actions
1. Create the table through the project's migration tool. Column names below match the Debezium Outbox Event Router defaults, so the same table works with either relay:
   ```sql
   -- PostgreSQL
   CREATE TABLE billing.outbox (
     id            uuid PRIMARY KEY,
     aggregatetype varchar(255) NOT NULL,   -- e.g. 'invoice'
     aggregateid   varchar(255) NOT NULL,   -- ordering key
     type          varchar(255) NOT NULL,   -- e.g. 'InvoiceIssued'
     payload       jsonb NOT NULL,
     created_at    timestamptz NOT NULL DEFAULT now(),
     published_at  timestamptz NULL
   );
   CREATE INDEX outbox_unpublished ON billing.outbox (created_at) WHERE published_at IS NULL;
   ```
   MySQL: `id CHAR(36)` or `BINARY(16)`, `payload JSON`, `created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6)`, and a plain index on `(published_at, created_at)` (MySQL has no partial indexes).
2. Write one helper `add_outbox_event(tx, aggregate_type, aggregate_id, event_type, payload)` that inserts using the caller's transaction handle. It must not open its own connection.

   | Stack | Same-transaction pattern |
   |---|---|
   | python (Django) | inside `with transaction.atomic():` call `Outbox.objects.create(...)` |
   | python (SQLAlchemy) | `with session.begin(): session.add(invoice); session.add(OutboxRow(...))` |
   | node (knex / TypeORM) | `await knex.transaction(async trx => { await trx('invoices').insert(...); await trx('outbox').insert(...); })` or `dataSource.transaction(async manager => ...)` |
   | go (database/sql) | `tx, err := db.BeginTx(ctx, nil)`; both `tx.ExecContext` calls; `tx.Commit()` |
   | java (Spring) | both repository saves inside one `@Transactional` method on a Spring bean, called from another bean (self-invocation skips the proxy) |

3. Call the helper at each business write that consumers care about, one call site per commit, with tests run after each.
4. Never publish to the broker inside the business transaction. That reintroduces dual write.

### Output
Outbox table and write path.

### Quality Gate
- Test: a business write followed by a forced exception before commit leaves zero rows in both the business table and `outbox` (rollback covers both).
- Test: a successful write leaves exactly one outbox row with the right `aggregateid`.

---

## Phase 2: Relay

### Entry Criteria
- Write path tested.

### Actions
1. Choose the relay: if the project already runs Kafka Connect with Debezium, use the Outbox Event Router; otherwise use a polling relay.
2. Polling relay loop (one worker or several):
   ```sql
   BEGIN;
   SELECT id, aggregatetype, aggregateid, type, payload FROM billing.outbox
     WHERE published_at IS NULL ORDER BY created_at LIMIT :batch FOR UPDATE SKIP LOCKED;
   -- publish each row to the broker with key = aggregateid, header event_id = id; wait for broker ack
   UPDATE billing.outbox SET published_at = now() WHERE id = ANY(:ids);
   COMMIT;
   ```
   `SKIP LOCKED` is available in PostgreSQL 9.5+ and MySQL 8.0+. `:batch` is a tuning value the user sets; record it. If the broker ack fails, roll back so rows stay unpublished.
3. Ordering: with several relay workers, two events for the same aggregate can be published out of order. If consumers need per-aggregate order, run one relay worker, or partition workers by `hash(aggregateid)`.
4. Debezium relay: add to the source connector config `"transforms": "outbox"`, `"transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter"`, and include only the outbox table in `table.include.list`. Routing and field options are in the Debezium Outbox Event Router docs; leave defaults unless a column name differs.
5. Clean up published rows with a scheduled delete of rows with `published_at` older than a retention the user specifies.

### Output
Running relay.

### Quality Gate
- After a write, the event appears on the topic: `kafka-console-consumer.sh --bootstrap-server $BROKER --topic <topic> --from-beginning --property print.key=true --max-messages 1` (or the broker's equivalent) shows key = aggregate ID.
- `SELECT COUNT(*) FROM billing.outbox WHERE published_at IS NULL;` returns to zero after the relay runs.

---

## Phase 3: Idempotent Consumer and Crash Test

### Entry Criteria
- Relay publishes.

### Actions
1. Consumer stores processed event IDs in its own table in the same transaction as its effect: `CREATE TABLE processed_events (event_id uuid PRIMARY KEY, processed_at timestamptz NOT NULL DEFAULT now());` then `INSERT ... ON CONFLICT (event_id) DO NOTHING` (PostgreSQL) or `INSERT IGNORE` (MySQL); if zero rows were inserted, skip the effect.
2. Crash test: kill the relay (`kill -9 <pid>`) after publish but before the `UPDATE ... published_at` commits, restart it, and confirm the event is published again and the consumer applies it once.
3. Count test: write N business changes, run relay and consumer, assert outbox count N, consumer effects N, duplicates delivered greater than or equal to zero, effects still N.

### Output
`outbox_implementation`.

### Quality Gate
- Crash test: consumer effect count equals business write count.
- Consumer log shows at least one skipped duplicate during the crash test.

---

## Worked Example

Illustrative. Go, PostgreSQL, polling relay, Kafka.

```go
tx, err := db.BeginTx(ctx, nil)
if err != nil { return err }
defer tx.Rollback()
if _, err = tx.ExecContext(ctx, `INSERT INTO billing.invoices (id, order_id, total_minor) VALUES ($1,$2,$3)`, id, orderID, total); err != nil { return err }
if err = outbox.Add(ctx, tx, "invoice", id, "InvoiceIssued", payload); err != nil { return err }
return tx.Commit()
```
Crash test: 500 invoices written; relay killed twice; topic contained 503 messages; consumer `processed_events` 500 rows, log `skipped duplicate event_id=...` 3 times.

---

## Exit Criteria

DONE when every relevant business write adds an outbox row in the same transaction, the relay publishes with the aggregate ID as key, consumers deduplicate by event ID, and the crash test shows zero loss.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Helper opens its own connection | **Stop**: rewrite to take the transaction handle; otherwise rollback does not cover it. |
| Phase 1 | Spring `@Transactional` not applied | **Adjust**: call the method from another bean; self-invocation bypasses the proxy. |
| Phase 2 | Outbox grows without bound | **Retry**: check relay logs for broker errors; confirm `published_at` is set only after ack. |
| Phase 3 | Duplicate effects observed | **Stop**: dedupe insert is not in the same transaction as the effect; fix before any rollout. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
