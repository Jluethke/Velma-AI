# Python Usage Reporter Worker

**One-line description:** Runs a Python worker that drains the usage outbox to Stripe meter events with stripe.billing.MeterEvent.create, using the outbox identifier for dedupe, FOR UPDATE SKIP LOCKED for safe concurrency, retry only on retryable errors, and a separate path for events outside Stripe's accepted timestamp window.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `usage_outbox_schema` (string, required): From `bill-usage-event-capture`.
- `meter_config` (object[], required): From `bill-stripe-meter-create`.

---

## Outputs

- `usage_reporter` (string): Path to the worker module, its entry command, and its tests.
- `report_run_log` (object[]): For a test run: rows claimed, rows reported, rows failed by error type, rows routed to late handling.

---

## Phase 1: Claim and Send

### Entry Criteria
- `pip show stripe` version supports `stripe.billing.MeterEvent` (check the library changelog).
- `STRIPE_SECRET_KEY` set to a test-mode key.

### Actions
1. Claim a batch in one transaction so two workers never send the same row:
   ```sql
   SELECT id, identifier, event_name, customer_ref, value, occurred_at
   FROM usage_outbox WHERE reported_at IS NULL
   ORDER BY created_at LIMIT %(batch)s FOR UPDATE SKIP LOCKED;
   ```
   `batch` is a user setting; record it.
2. For each row send:
   ```python
   stripe.billing.MeterEvent.create(
       event_name=row.event_name,
       payload={"stripe_customer_id": row.customer_ref, "value": str(row.value)},
       identifier=row.identifier,
       timestamp=int(row.occurred_at.timestamp()),
   )
   ```
   Payload keys must equal the meter's `customer_mapping` and `value_settings` keys in `meter_config`. Payload values are strings.
3. On success set `reported_at = now()` in the same transaction that holds the lock, then commit.
4. Because `identifier` is the outbox identifier, a crash after Stripe accepted the event but before commit causes a resend that Stripe deduplicates. Read the dedupe window for identifiers in the Meter Events API reference and record it.
5. For high volume, check the docs for the v2 meter event stream API; do not switch without reading its auth and rate rules.

### Output
Worker loop.

### Quality Gate
- After one run on 10 test rows, `SELECT count(*) FROM usage_outbox WHERE reported_at IS NULL` is 0 and the meter event summary for the test customer equals the sum of the 10 values.
- Running two worker processes at once on 100 rows gives the same summary total as one process.

---

## Phase 2: Errors and Late Events

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Classify errors from the `stripe` exception class:

| Exception or status | Action |
|---|---|
| `stripe.error.RateLimitError` (429) | Leave unreported, back off with jitter, retry next run |
| `stripe.error.APIConnectionError` or 5xx | Leave unreported, increment `attempts`, retry |
| `stripe.error.InvalidRequestError` mentioning timestamp | Route to late handling (step 2) |
| `stripe.error.InvalidRequestError` other (bad customer, unknown event name) | Set `last_error`, stop retrying, alert |
| `stripe.error.AuthenticationError` | Stop the worker, alert |

   Newer library versions also expose these at `stripe.RateLimitError` etc.; use what your version documents. The library has built-in retries (`stripe.max_network_retries`); set it explicitly and record the value.
2. Late events: Stripe accepts meter event timestamps only within a window documented in the Meter Events API reference (past days and a small future skew). Before sending, compare `occurred_at` with that window. Outside it, do not send with a fake timestamp. Set `last_error='late'` and report it for manual handling: a one-off invoice item (`stripe.InvoiceItem.create`) for the amount on the next invoice, approved by the user.
3. An event inside the window but for a period whose invoice is already finalized is billed in the current period by Stripe aggregation rules for that timestamp; read the docs on usage for finalized periods and record which applies.
4. Never delete outbox rows that failed; they are the audit record.

### Output
Error and late paths.

### Quality Gate
- A unit test with a mocked `RateLimitError` leaves the row unreported with `attempts` incremented.
- A test row with `occurred_at` outside the documented window ends with `last_error='late'` and was not sent (mock asserts zero calls).

---

## Phase 3: Run and Observe

### Entry Criteria
- Tests pass: `pytest -q` exits 0.

### Actions
1. Run as a scheduled process (cron, systemd timer, Celery beat, or a Kubernetes CronJob) with `python -m app.billing.usage_reporter`.
2. Log per run: claimed, sent, retryable failures, permanent failures, late. Write the test run counts to `report_run_log`.
3. Add an alert when the oldest unreported row's `created_at` age exceeds a user-set limit: `SELECT now() - min(created_at) FROM usage_outbox WHERE reported_at IS NULL AND last_error IS NULL`.

### Output
`usage_reporter` and `report_run_log`.

### Quality Gate
- `report_run_log` counts add up: claimed = sent + retryable + permanent + late.

---

## Worked Example

Illustrative only.

10 rows `api_calls` values 1..10 for `cus_T`. Run: claimed 10, sent 10. `stripe get /v1/billing/meters/mtr_.../event_summaries -d customer=cus_T -d start_time=... -d end_time=...` returns `aggregated_value` 55. One row backdated beyond the documented window: `last_error='late'`, not sent.

---

## Exit Criteria

DONE when the worker sends each outbox row once under concurrency, classifies errors by table, keeps late events out of the meter, and logs balanced counts.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Summary total exceeds outbox total | **Stop**: identifiers are not stable; inspect how they are built in capture. |
| Phase 1 | "No meter found for event_name" | **Adjust**: event names must match `meter_config` exactly. |
| Phase 2 | Permanent failures pile up | **Return**: list them with `last_error` for the user; do not retry blindly. |
| Phase 3 | Backlog age keeps rising | **Adjust**: raise batch size or worker count within Stripe rate limits from the docs. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
