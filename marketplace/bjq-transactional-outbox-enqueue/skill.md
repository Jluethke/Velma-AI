# Transactional Outbox Enqueue

**One-line description:** Replaces "write to the database, then enqueue" with an outbox table written in the same transaction and a relay that publishes pending rows using `FOR UPDATE SKIP LOCKED`, so a job exists if and only if its business transaction committed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `job_inventory` (object[], required): Output of `bjq-handler-side-effect-audit`, with enqueue call sites.
- `payload_schema` (object[], required): Output of `bjq-job-payload-design`; the outbox row stores this envelope.
- `stack` (string, required): `python`, `node` or `ruby`.
- `database` (string, required): `postgres` or `mysql` (MySQL 8.0 or later, which supports `SKIP LOCKED`).

---

## Outputs

- `outbox_design` (object): The decision per enqueue site (outbox, after-commit hook, or unchanged), the table DDL, relay loop, and cleanup rule.
- `outbox_patch` (object[]): Per changed enqueue site: file, diff, and the output of the crash-window test.

---

## Phase 1: Find Dual-Write Enqueue Sites

### Entry Criteria
- `job_inventory` lists enqueue call sites.

### Actions
1. For each enqueue site, open the function and decide whether it is inside or right after a database transaction. Patterns to search:
   - Python: `rg -n "transaction.atomic|session.commit|conn.commit|with .*begin\(" ` near the enqueue line.
   - Node: `rg -n "BEGIN|\.transaction\(|\$transaction" ` near the enqueue line.
   - Ruby: `rg -n "transaction do|\.save!?|\.create!?|\.update!?" ` near the enqueue line.
2. Classify each site:

| Case | Failure it causes | Decision |
|---|---|---|
| Enqueue inside the open transaction, before commit | Worker runs before commit and reads missing or old data; if the transaction rolls back, the job still runs. | Outbox |
| Enqueue after commit (`transaction.on_commit`, Celery `delay_on_commit`, Rails `after_commit`, `Sidekiq.transactional_push!`) | If the process dies or the broker is down between commit and publish, the job is lost. | Outbox when losing the job is not acceptable for this job (class C or D effect); keep the hook only if the requester accepts loss for this job in writing. |
| Enqueue with no related database write | No dual write. | Unchanged |
| The queue itself is stored in the same database (for example a Postgres-backed queue) | No dual write; enqueue in the same transaction. | Unchanged; note it |

### Output
Site classification in `outbox_design`.

### Quality Gate
- Every enqueue site from `job_inventory` has one decision.
- Every "keep the hook" decision quotes the requester's acceptance.

---

## Phase 2: Add the Outbox Table and Write Path

### Entry Criteria
- At least one site is marked Outbox.

### Actions
1. Migration (Postgres):
```sql
CREATE TABLE job_outbox (
  id            bigserial PRIMARY KEY,
  idempotency_key text NOT NULL UNIQUE,
  queue_name    text NOT NULL,
  job_name      text NOT NULL,
  payload       jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz,
  attempts      int NOT NULL DEFAULT 0,
  last_error    text
);
CREATE INDEX job_outbox_pending_idx ON job_outbox (id) WHERE published_at IS NULL;
```
MySQL has no partial index: use `INDEX (published_at, id)` instead.
2. Change one enqueue site at a time. Replace the enqueue call with an insert into `job_outbox` using the same transaction object as the business write. The `UNIQUE` on `idempotency_key` makes a repeated request insert nothing: use `ON CONFLICT (idempotency_key) DO NOTHING` (Postgres) or `ON DUPLICATE KEY UPDATE idempotency_key = idempotency_key` (MySQL).
3. Do not call the broker client anywhere inside the transaction.

### Output
Migration and the first rewritten write path.

### Quality Gate
- `rg -n "<enqueue pattern>" <changed file>` shows no broker call inside the transaction block.
- A test that rolls back the transaction finds zero rows in `job_outbox` (`SELECT count(*) FROM job_outbox` returns 0).

---

## Phase 3: Build the Relay

### Entry Criteria
- Outbox rows are written.

### Actions
1. Relay loop, one batch per iteration, each batch in its own transaction:
```sql
BEGIN;
SELECT id, queue_name, job_name, payload FROM job_outbox
 WHERE published_at IS NULL
 ORDER BY id
 LIMIT $batch
 FOR UPDATE SKIP LOCKED;
-- publish each row to the broker; wait for the broker's confirmation
UPDATE job_outbox SET published_at = now() WHERE id = ANY($published_ids);
UPDATE job_outbox SET attempts = attempts + 1, last_error = $err WHERE id = ANY($failed_ids);
COMMIT;
```
2. Wait for the broker's confirmation before marking a row published: SQS `SendMessage` returns a `MessageId`; RabbitMQ needs publisher confirms (pika `channel.confirm_delivery()`, amqplib `createConfirmChannel()`, Bunny `ch.confirm_select` plus `ch.wait_for_confirms`); Redis-based libraries return after the Redis write.
3. Accept that a crash after publish and before `COMMIT` republishes those rows. The consumer is protected by `bjq-idempotency-key-store`, which is why the outbox row carries the same `idempotency_key`.
4. Run the relay as its own process (or a scheduled job), with more than one instance allowed; `SKIP LOCKED` lets instances take different rows. Batch size and poll interval are user inputs; record them as such.
5. Alternative when the team already runs Debezium: change data capture on `job_outbox` with the Debezium outbox event router replaces the polling relay. Do not introduce Debezium only for this.
6. Cleanup: delete rows where `published_at` is older than a user-supplied retention, in batches.

### Output
Relay code and cleanup job in `outbox_patch`.

### Quality Gate
- With two relay processes running against 1000 test rows, `SELECT count(*) FROM job_outbox WHERE published_at IS NULL` reaches 0 and the broker received each `idempotency_key` at least once.
- Relay logs show no row marked published without a broker confirmation (search relay code for the update statement; it runs only after the publish call returns).

---

## Phase 4: Prove the Crash Window Is Closed

### Entry Criteria
- Relay works.

### Actions
1. Test A (rollback): business write plus outbox insert, then raise before commit. Assert no outbox row and no job in the broker.
2. Test B (broker down): stop the broker (`docker stop <redis|rabbitmq|elasticmq container>`), run the business transaction, assert the outbox row exists and `published_at IS NULL`; start the broker, run one relay iteration, assert the row is published.
3. Run the full test suite. Do not delete or skip tests that called the old enqueue path; update them to assert on `job_outbox` rows instead and list each change in `outbox_patch`.

### Output
`outbox_design`, `outbox_patch` with test output.

### Quality Gate
- Tests A and B pass and their output is pasted in `outbox_patch`.
- Full suite exits 0.

---

## Worked Example

Illustrative only.

Input: `stack` = `node`, `database` = `postgres`; site `src/orders/place.ts:31` calls `await queue.add('charge', env)` after `await tx.commit()`.

- Phase 1: after-commit enqueue with a class D effect (payment). Decision: Outbox.
- Phase 2: `await tx.query("INSERT INTO job_outbox (idempotency_key, queue_name, job_name, payload) VALUES ($1,'payments','charge',$2) ON CONFLICT (idempotency_key) DO NOTHING", [env.idempotency_key, env])` before `COMMIT`.
- Phase 3: relay calls `queue.add(row.job_name, row.payload, { jobId: row.payload.idempotency_key })` and marks published.
- Phase 4:
```
$ docker stop redis-test && npx vitest run test/outbox.test.ts -t "broker down"
 PASS  outbox row stays pending while Redis is down, publishes after restart
```

---

## Exit Criteria

DONE when every enqueue site that needs it writes to `job_outbox` in the business transaction, a relay publishes rows with broker confirmation, and the rollback and broker-down tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Business write and enqueue are in different services | **Return**: the outbox belongs in the service that owns the transaction; report the owner. |
| Phase 2 | MySQL version below 8.0 (no `SKIP LOCKED`) | **Adjust**: run a single relay instance with a lock (`GET_LOCK('job_outbox_relay', 0)`) and record the limitation. |
| Phase 3 | Relay marks rows published but jobs never arrive | **Stop**: the confirmation is not awaited; fix the publish call before continuing. |
| Phase 3 | Outbox grows without bound | **Adjust**: check the relay is running and the cleanup job is scheduled; alert on oldest pending row age. |
| Phase 4 | Broker-down test cannot stop the broker | **Adjust**: point the relay at an unreachable port in the test configuration instead. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
