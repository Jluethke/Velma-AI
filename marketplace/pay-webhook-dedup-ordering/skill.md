# Webhook Event Deduplication and Ordering

**One-line description:** Adds a processed-events table keyed on the provider event id with a unique constraint, makes handlers re-fetch current object state instead of trusting event order, and proves duplicate and out-of-order delivery leave exactly one correct outcome.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root.
- `database` (string, required): `postgres`, `mysql` or `sqlite`.
- `webhook_handler_file` (string, required): Path of the verified webhook handler built by the stack webhook flow.

---

## Outputs

- `event_store_schema` (object): DDL applied, migration file name, and the insert statement used for deduplication.
- `dedup_test_results` (object[]): Results of the duplicate, out-of-order and concurrent-delivery tests.

---

## Phase 1: Create the Event Store

### Entry Criteria
- Signature verification passes for forwarded events.

### Actions
1. Know the delivery contract: Stripe documents that endpoints can receive the same event more than once and that event order is not guaranteed. PayPal and Adyen document retries too. Your code must tolerate both.
2. Add a migration with this table (adjust types per `database`):
   ```sql
   CREATE TABLE webhook_events (
     provider     VARCHAR(16)  NOT NULL,
     event_id     VARCHAR(255) NOT NULL,
     event_type   VARCHAR(128) NOT NULL,
     object_id    VARCHAR(255),
     received_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
     processed_at TIMESTAMP,
     status       VARCHAR(16)  NOT NULL DEFAULT 'received',
     PRIMARY KEY (provider, event_id)
   );
   ```
3. Insert-if-absent statement per database:
   | Database | Statement |
   |---|---|
   | postgres | `INSERT INTO webhook_events (provider, event_id, event_type, object_id) VALUES ($1,$2,$3,$4) ON CONFLICT (provider, event_id) DO NOTHING` then check rows affected |
   | mysql | `INSERT IGNORE INTO webhook_events (...) VALUES (...)` then check affected rows |
   | sqlite | `INSERT OR IGNORE INTO webhook_events (...) VALUES (...)` then check `changes()` |
4. Event ids: Stripe `evt_...` (`event.id`); PayPal `id` of the webhook event; Adyen `pspReference` combined with `eventCode` and `success` (Adyen can send the same pspReference for different event codes).

### Output
Migration file and statement.

### Quality Gate
- Running the migration exits 0, and `\d webhook_events` (psql), `SHOW CREATE TABLE webhook_events` (mysql) or `.schema webhook_events` (sqlite) shows the primary key on `(provider, event_id)`.

---

## Phase 2: Process Once, Re-Fetch State

### Entry Criteria
- Table exists.

### Actions
1. In the handler, after verification: run the insert. If zero rows were inserted, return 200 immediately (already seen).
2. In the worker (or handler), do not trust the event's embedded object as current. Retrieve the object from the API (`PaymentIntent.retrieve`, `Charge.retrieve`, `Refund.retrieve`) and act on its current status. This makes order irrelevant: a late `payment_intent.payment_failed` arriving after success re-reads `succeeded` and does nothing.
3. Write state transitions as conditional updates that only move forward, for example `UPDATE orders SET status='paid' WHERE id=? AND status IN ('pending','awaiting_payment')`.
4. On success set `processed_at` and `status='processed'`. On an exception set `status='failed'` and return 500 so the provider retries; the next delivery sees the row with `status='failed'` and must reprocess it, so treat `failed` rows as not yet processed.

### Output
Handler with dedup and re-fetch.

### Quality Gate
- `rg -n "ON CONFLICT|INSERT IGNORE|INSERT OR IGNORE" <webhook_handler_file or its repository module>` shows the dedup statement.
- `rg -n "retrieve|\.Get\(" <worker file>` shows a re-fetch before each state change.

---

## Phase 3: Prove It

### Entry Criteria
- `stripe listen` running.

### Actions
1. Duplicate: `stripe trigger payment_intent.succeeded`, note the `evt_` id, then `stripe events resend evt_...`. Expected: one fulfillment, `webhook_events` has one row for that id.
2. Out of order: in a unit test, deliver a `payment_intent.payment_failed` after `payment_intent.succeeded` for the same intent with the API mocked to return `succeeded`. Expected: order stays `paid`.
3. Concurrent: in a test, send the same event from two threads or goroutines at once. Expected: exactly one processes (the other sees zero rows inserted).
4. Record results.

### Output
`dedup_test_results`.

### Quality Gate
- `SELECT count(*) FROM webhook_events WHERE event_id='<evt id>'` returns `1` after the resend.
- `SELECT count(*) FROM fulfillments WHERE order_id=<id>` (or your equivalent) returns `1`.
- All three tests pass in the runner summary.

---

## Worked Example

Illustrative. Postgres.

```
$ stripe events resend evt_3QhK...
# listen: <-- [200] POST http://localhost:4242/webhook [evt_3QhK...]  (twice in total)
psql> SELECT count(*) FROM webhook_events WHERE event_id='evt_3QhK...';
 count
-------
     1
psql> SELECT count(*) FROM fulfillments WHERE order_id=8812;
     1
```

---

## Exit Criteria

DONE when every event id is stored once under a unique key, handlers act on re-fetched state with forward-only updates, and the three tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Existing table with the same name | **Stop**: do not alter it blindly; read it and reuse it if it has a unique event id key. |
| Phase 2 | Re-fetch hits rate limits under load | **Adjust**: re-fetch only for events that change order state; log the rest. |
| Phase 3 | Two fulfillments after resend | **Stop**: the dedup check is after side effects; move it first. |
| Phase 3 | Concurrent test flaky | **Retry**: rerun it repeatedly (for example `go test -count=<n>` or `pytest --count=<n>` with pytest-repeat; record `<n>`); any double processing is a defect, not flakiness. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
