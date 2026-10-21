# Usage Event Capture Outbox

**One-line description:** Captures each billable usage event in the application's PostgreSQL database through a transactional outbox row written in the same transaction as the work it bills, with a stable idempotency identifier so retries and replays never double-bill.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `meter_config` (object[], required): From `bill-stripe-meter-create` (event names, payload keys). For a merchant-of-record provider, pass the usage dimensions from the pricing spec in the same shape.
- `database_url` (string, required): PostgreSQL connection URL.

---

## Outputs

- `usage_outbox_schema` (string): Migration file path and DDL of `usage_outbox`.
- `capture_code` (string): Path to the `record_usage` function and the list of call sites that use it.

---

## Phase 1: Create the Outbox Table

### Entry Criteria
- `meter_config` has at least one row.

### Actions
1. Add a migration with the app's migration tool (Alembic, Prisma, Knex, golang-migrate):
   ```sql
   CREATE TABLE usage_outbox (
     id bigserial PRIMARY KEY,
     identifier text NOT NULL UNIQUE,
     event_name text NOT NULL,
     customer_ref text NOT NULL,
     value numeric NOT NULL,
     occurred_at timestamptz NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now(),
     reported_at timestamptz,
     attempts int NOT NULL DEFAULT 0,
     last_error text
   );
   CREATE INDEX usage_outbox_unreported ON usage_outbox (created_at) WHERE reported_at IS NULL;
   ```
2. `occurred_at` is when the usage happened (the billing time). `created_at` is when the row was written. Keep both; late-event handling uses the difference.
3. `customer_ref` stores the provider customer ID (`cus_...`) resolved at capture time from the account record, so the reporter never has to look it up.
4. Apply the migration in a dev database and inspect it: `psql "$DATABASE_URL" -c "\d usage_outbox"`.

### Output
`usage_outbox_schema`.

### Quality Gate
- `\d usage_outbox` lists the unique index on `identifier` and the partial index.

---

## Phase 2: Write the Capture Function

### Entry Criteria
- Table exists.

### Actions
1. Build the identifier from the business fact, never from a random UUID generated at insert time: `f"{event_name}:{request_id}"` for one event per API request, or `f"{event_name}:{job_id}:{chunk_no}"` for batch jobs. A retry of the same request must produce the same identifier.
2. `record_usage(tx, event_name, customer_ref, value, occurred_at, identifier)` runs `INSERT INTO usage_outbox (...) VALUES (...) ON CONFLICT (identifier) DO NOTHING` on the caller's transaction `tx`.
3. Call it inside the same transaction that commits the billable work (the saved report, the completed job). If the work rolls back, the usage row rolls back with it. Do not call the provider API here.
4. Do not aggregate in the app before writing; write one row per billable fact. Aggregation is the meter's job, and per-fact rows are what reconciliation reads.
5. Add each call site to `capture_code` with file and line.

### Output
`capture_code`.

### Quality Gate
- A test calls `record_usage` twice with the same identifier and asserts `SELECT count(*) FROM usage_outbox WHERE identifier = ...` is 1.
- A test rolls back the outer transaction and asserts no outbox row exists.
- `grep -rn "meter_events\|meterEvents\|MeterEvent" <capture call site files>` returns nothing: capture never calls the provider.

---

## Worked Example

Illustrative only.

API request `req_8f2` uses 3 report credits. Inside the request transaction: `record_usage(tx, "report_credits", "cus_T", 3, now(), "report_credits:req_8f2")`. A client retry of `req_8f2` hits `ON CONFLICT DO NOTHING`. `SELECT identifier, value, reported_at FROM usage_outbox` shows one row `report_credits:req_8f2 | 3 | NULL`.

---

## Exit Criteria

DONE when every billable action writes exactly one outbox row in its own transaction with a deterministic identifier, proven by the duplicate and rollback tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No migration tool in the project | **Stop**: ask the user which tool to adopt; do not run DDL by hand on shared databases. |
| Phase 2 | No natural request or job ID to build the identifier | **Adjust**: add a client-supplied idempotency key header and use it. |
| Phase 2 | Usage written outside the work transaction | **Retry**: move the call into the transaction and rerun the rollback test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
