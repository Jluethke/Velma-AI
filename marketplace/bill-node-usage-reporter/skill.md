# Node.js Usage Reporter Worker

**One-line description:** Runs a Node.js worker that drains the usage outbox to Stripe meter events with stripe.billing.meterEvents.create, using the outbox identifier for dedupe, FOR UPDATE SKIP LOCKED for safe concurrency with node-postgres, retry only on retryable errors, and a separate path for late events.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `usage_outbox_schema` (string, required): From `bill-usage-event-capture`.
- `meter_config` (object[], required): From `bill-stripe-meter-create`.

---

## Outputs

- `usage_reporter` (string): Path to the worker module, its start command, and its tests.
- `report_run_log` (object[]): For a test run: rows claimed, reported, failed by error type, routed to late handling.

---

## Phase 1: Claim and Send

### Entry Criteria
- `npm ls stripe pg` prints versions; the `stripe` package version has `stripe.billing.meterEvents` (check its changelog).
- `STRIPE_SECRET_KEY` is a test-mode key.

### Actions
1. With `pg`, take a client from the pool and run `BEGIN`, then:
   ```sql
   SELECT id, identifier, event_name, customer_ref, value, occurred_at
   FROM usage_outbox WHERE reported_at IS NULL
   ORDER BY created_at LIMIT $1 FOR UPDATE SKIP LOCKED;
   ```
   The batch size `$1` is a user setting; record it.
2. Send each row:
   ```js
   await stripe.billing.meterEvents.create({
     event_name: row.event_name,
     payload: { stripe_customer_id: row.customer_ref, value: String(row.value) },
     identifier: row.identifier,
     timestamp: Math.floor(new Date(row.occurred_at).getTime() / 1000),
   });
   ```
   `pg` returns `numeric` columns as strings by default; keep `value` a string and never parse it to a float.
3. On success `UPDATE usage_outbox SET reported_at = now() WHERE id = $1`, then `COMMIT`. Always `client.release()` in a `finally` block.
4. Configure `new Stripe(key, { maxNetworkRetries: N })` with N a user setting; record it.
5. A crash between Stripe accepting the event and `COMMIT` leads to a resend that Stripe deduplicates by `identifier`; read the dedupe window in the Meter Events API reference and record it.

### Output
Worker loop.

### Quality Gate
- After one run on 10 test rows, `SELECT count(*) FROM usage_outbox WHERE reported_at IS NULL` is 0 and the meter event summary equals the sum of values.
- Two concurrent worker processes on 100 rows produce the same summary total as one.

---

## Phase 2: Errors and Late Events

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Classify by `err.type` (`stripe-node` error classes):

| `err.type` | Action |
|---|---|
| `StripeRateLimitError` | Leave unreported, back off with jitter |
| `StripeConnectionError`, `StripeAPIError` | Increment `attempts`, retry next run |
| `StripeInvalidRequestError` about timestamp | Late handling (step 2) |
| `StripeInvalidRequestError` other | Set `last_error`, stop retrying, alert |
| `StripeAuthenticationError` | Stop the worker, alert |

2. Before sending, check `occurred_at` against the timestamp window documented in the Meter Events API reference. Outside it: set `last_error = 'late'`, do not send, and list it for a user-approved one-off invoice item (`stripe.invoiceItems.create`).
3. Never rewrite `occurred_at` to fit the window; that bills usage in the wrong period.
4. Keep failed rows; they are the audit record.

### Output
Error and late paths.

### Quality Gate
- A test with a mocked `StripeRateLimitError` (vitest `vi.spyOn` or jest `jest.spyOn` on `stripe.billing.meterEvents.create`) leaves the row unreported with `attempts` incremented.
- A test row outside the window ends with `last_error = 'late'` and zero calls to the mock.

---

## Phase 3: Run and Observe

### Entry Criteria
- `npx vitest run` or `npx jest` exits 0.

### Actions
1. Run on a schedule: a BullMQ repeatable job, a Kubernetes CronJob running `node dist/billing/usageReporter.js`, or a systemd timer.
2. Log per run: claimed, sent, retryable, permanent, late; write test counts to `report_run_log`.
3. Alert on backlog age: `SELECT now() - min(created_at) FROM usage_outbox WHERE reported_at IS NULL AND last_error IS NULL` above a user-set limit.

### Output
`usage_reporter` and `report_run_log`.

### Quality Gate
- `report_run_log` counts balance: claimed = sent + retryable + permanent + late.

---

## Worked Example

Illustrative only.

10 rows values 1..10. Run logs `{claimed:10, sent:10, retryable:0, permanent:0, late:0}`; `event_summaries` returns `aggregated_value` 55. A forced 429 on row 3 logs `{claimed:10, sent:9, retryable:1}` and the next run sends it; total stays 55.

---

## Exit Criteria

DONE when each outbox row is sent once under concurrency, errors follow the table, late events stay out of the meter, and run counts balance.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Pool exhausted, worker hangs | **Adjust**: release the client in `finally`; check every code path. |
| Phase 1 | Value sent as `1e-7` style float | **Adjust**: keep `numeric` as the string `pg` returns. |
| Phase 2 | Permanent failures accumulate | **Return**: list them for the user; no blind retry. |
| Phase 3 | Backlog grows | **Adjust**: raise batch size or workers within documented rate limits. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
