# Idempotency Audit for Retried and Redelivered Operations

**One-line description:** Lists every operation that can run twice (client retries, HTTP POST resubmits, at-least-once queue redelivery, job retries, webhook replays), proves the duplicate with a replay test, and specifies a database-enforced idempotency key or natural unique constraint for each.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root.
- `suspect_paths` (object[], required): From `race-symptom-triage`.
- `database` (string, required): `postgres`, `mysql`, `sqlite`, `other`, or `none`.

---

## Outputs

- `idempotency_gaps` (object[]): One row per operation: `entry_point` (route, consumer, job, webhook handler, file:line), `duplicate_source` (from the source table), `side_effects` (rows written, external calls, messages sent), `replay_test` (name and result before fix), `key_design` (key source, unique constraint DDL, stored response, expiry), `concurrent_duplicate_safe` (true only when two simultaneous duplicates are handled by a database constraint or lock, not by a read-then-insert check).

---

## Phase 1: List Operations That Can Run Twice

### Entry Criteria
- `repo_path` exists.

### Actions
1. Find entry points and match each to a duplicate source:

| Search | Duplicate source |
|---|---|
| `rg -n "@(Post|PostMapping)|router\.post|app\.post|\.post\(|methods=\[.POST.\]|@app\.post" "<repo_path>"` | Client or proxy retry of a non-idempotent HTTP method (RFC 9110 section 9.2.2 defines PUT, DELETE and safe methods as idempotent; POST is not) |
| `rg -n "SqsClient|ReceiveMessage|@SqsListener|KafkaConsumer|@KafkaListener|consumer\.subscribe|channel\.consume|basic_consume|@RabbitListener|Subscription|pubsub" "<repo_path>"` | At-least-once delivery: SQS standard queues, Kafka after a rebalance before commit, RabbitMQ after a missing ack, Pub/Sub redelivery |
| `rg -n "@shared_task|@app\.task|bull|Queue\(|sidekiq|retry|Retry|backoff|attempts" "<repo_path>"` | Job framework retry after a timeout where the first attempt actually succeeded |
| `rg -n "webhook|Webhook|signature" "<repo_path>"` | Provider replays webhooks until it receives a 2xx |
| `rg -n "Retry|retry|tenacity|backoff|resilience4j|Polly|retryWhen" "<repo_path>"` on outbound calls | This service retries a call to another service; the other side may apply it twice |

2. For each entry point, list side effects in order: database writes (which table), external calls (payment provider, email, SMS), messages published.
3. Mark entry points with zero side effects or only naturally idempotent effects (`UPDATE ... SET status='shipped' WHERE id=?` setting an absolute value) as low risk with the reason.

### Output
Entry point list with duplicate source and side effects.

### Quality Gate
- Every entry point has one duplicate source from the table.
- Every side effect names a table, external API or topic.

---

## Phase 2: Prove the Duplicate With a Replay Test

### Entry Criteria
- At least one entry point with non-idempotent side effects.

### Actions
1. For each, write a test that delivers the same request or message twice: (a) sequentially, (b) concurrently with a start gate from `race-stress-harness`. Assert exactly one row and one external call (use a fake external client that counts calls).
2. Run both variants against the unfixed code and record results. The concurrent variant matters: a "check if processed, then process" guard passes the sequential test and fails the concurrent one.
3. Do not mock the database for this test; the fix depends on a real unique constraint. Use a test database (Docker container or the project's test DB fixture).

### Output
Replay test results per entry point.

### Quality Gate
- Each test asserts on a counted side effect (row count from `SELECT count(*)`, fake client call count).
- Results for both sequential and concurrent variants are recorded.

---

## Phase 3: Specify the Key Design

### Entry Criteria
- Replay results exist.

### Actions
1. Pick the key source, first matching row:

| Situation | Key |
|---|---|
| A natural unique business key exists (order number from client, payment intent id, message id from the provider) | That key, with a `UNIQUE` constraint on the target table |
| HTTP API with clients you control | `Idempotency-Key` request header (the IETF httpapi draft `draft-ietf-httpapi-idempotency-key-header` describes it); client generates a UUID per logical attempt and reuses it on retry |
| Queue message | The broker's message id is per delivery attempt on some brokers; use a producer-assigned id in the message body |
| Webhook | Provider's event id field |

2. Write the table and statement for `database`:
   - postgres: `CREATE TABLE idempotency_keys (key text PRIMARY KEY, request_hash text NOT NULL, status text NOT NULL, response jsonb, created_at timestamptz NOT NULL DEFAULT now());` then `INSERT INTO idempotency_keys (key, request_hash, status) VALUES ($1, $2, 'started') ON CONFLICT (key) DO NOTHING RETURNING key;` No row returned means a duplicate.
   - mysql: same table with `key VARCHAR(255) PRIMARY KEY`, `response JSON`; `INSERT IGNORE INTO idempotency_keys ...` and check affected rows, or `INSERT ... ON DUPLICATE KEY UPDATE key = key`.
   - sqlite: `INSERT OR IGNORE INTO idempotency_keys ...` and check `changes()`.
3. Put the key insert and the business write in the SAME database transaction so both commit or neither does. For external calls (payment, email), pass the same key to the provider's own idempotency feature where it has one, or use a transactional outbox: write an outbox row in the business transaction and send from a relay that is itself idempotent.
4. On duplicate: if `status` = `completed`, return the stored `response`; if `started`, return a conflict (HTTP 409) or retry later; if `request_hash` differs for the same key, reject (HTTP 422), as the IETF draft describes.
5. Retention of keys is a business decision: record it as a user input or an open question. Do not invent an expiry.
6. Never implement the guard as `SELECT` then `INSERT` without a unique constraint; set `concurrent_duplicate_safe` = false for any design that does.

### Output
`idempotency_gaps`.

### Quality Gate
- Every non-low-risk row has `key_design` with DDL containing `PRIMARY KEY` or `UNIQUE`.
- `concurrent_duplicate_safe` is true only for designs that rely on the constraint.

---

## Worked Example

Illustrative only.

Phase 1: `rg -n "@KafkaListener" src/` finds `PaymentCapturedListener.java:31`, side effects: insert into `ledger_entries`, call `EmailClient.sendReceipt`. Duplicate source: Kafka redelivery after rebalance.

Phase 2: `replayCapturedTwice_concurrent` delivers the same record from two threads. Result: `expected: <1> but was: <2>` ledger rows, 2 emails.

Phase 3: key = `paymentId` from the message body. DDL `ALTER TABLE ledger_entries ADD CONSTRAINT uq_ledger_payment UNIQUE (payment_id);`; insert with `ON CONFLICT (payment_id) DO NOTHING RETURNING id`; email moved to an outbox row in the same transaction. `concurrent_duplicate_safe` true. Retention: not applicable (constraint is permanent).

---

## Exit Criteria

DONE when every entry point that can run twice is listed with its side effects, has a sequential and concurrent replay result, and has a key design enforced by a database constraint.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `database` is `none` and the effect is external only | **Adjust**: use the provider's idempotency key feature, and record that local dedupe needs a durable store. |
| Phase 2 | No test database available | **Stop**: a constraint-based fix cannot be proven against mocks; ask for a test database. |
| Phase 3 | Existing duplicate rows block adding a `UNIQUE` constraint | **Adjust**: write a one-time dedupe migration reviewed by the user before adding the constraint; do not delete rows without that review. |
| Phase 3 | Key retention unknown | **Return**: record it as an open question in `key_design`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
