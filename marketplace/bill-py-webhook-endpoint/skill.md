# Python Stripe Webhook Endpoint

**One-line description:** Builds a Python (Flask or FastAPI) Stripe webhook endpoint that verifies the Stripe-Signature header against the raw request body with stripe.Webhook.construct_event, deduplicates by event id in a database table, and returns 2xx before slow work.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `stripe_api_version` (string, optional): API version pinned in the app (`stripe.api_version`). Default: the account default, recorded.
- `app_framework` (string, required): "flask" or "fastapi".
- `database_url` (string, required): PostgreSQL connection URL for the app database.

---

## Outputs

- `webhook_handler` (string): Path to the module with the endpoint and the event dispatch table, for example `app/billing/webhooks.py`.
- `processed_events_table` (string): Name and DDL of the dedupe table, `stripe_processed_events`.

---

## Phase 1: Endpoint and Signature Check

### Entry Criteria
- `pip show stripe` prints a version. Record it.
- The signing secret is in the environment variable `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`). For local work it comes from `stripe listen`.

### Actions
1. Read the raw body as bytes. Flask: `payload = request.get_data()`. FastAPI: `payload = await request.body()`. Never call `request.json` or `request.get_json()` before verification; re-serialized JSON changes the bytes and the signature fails.
2. Verify:
   ```python
   sig = request.headers.get("Stripe-Signature")
   try:
       event = stripe.Webhook.construct_event(payload, sig, os.environ["STRIPE_WEBHOOK_SECRET"])
   except ValueError:
       return 400  # body is not valid JSON
   except stripe.error.SignatureVerificationError:
       return 400
   ```
   Recent library versions also expose `stripe.SignatureVerificationError`; use whichever your installed version documents. Keep the library's default timestamp tolerance unless the user sets one.
3. Exempt the route from CSRF protection (Flask-WTF `csrf.exempt`) and from any body-parsing middleware.
4. Run locally: `stripe listen --forward-to localhost:8000/webhooks/stripe`. It prints the `whsec_` secret for that session.

### Output
Endpoint that returns 400 on bad signatures.

### Quality Gate
- `stripe trigger customer.created` shows `<-- [200]` in the `stripe listen` output.
- `curl -s -o /dev/null -w "%{http_code}" -X POST localhost:8000/webhooks/stripe -H "Stripe-Signature: t=1,v1=bad" -d "{}"` prints 400.

---

## Phase 2: Dedupe and Dispatch

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Create the table in a migration (Alembic or the app's tool), not by hand:
   ```sql
   CREATE TABLE stripe_processed_events (
     event_id text PRIMARY KEY,
     type text NOT NULL,
     received_at timestamptz NOT NULL DEFAULT now()
   );
   ```
2. On each verified event run `INSERT INTO stripe_processed_events (event_id, type) VALUES (%s, %s) ON CONFLICT (event_id) DO NOTHING RETURNING event_id`. If no row is returned, the event is a redelivery: return 200 and stop.
3. Do the insert and the business update in the same transaction so a crash does not mark an unprocessed event as done.
4. Dispatch with a dict `HANDLERS = {"invoice.paid": on_invoice_paid, ...}`. Unknown types return 200 and are logged; Stripe treats non-2xx as failure and retries.
5. Events are not ordered. In each handler, re-fetch the object (`stripe.Subscription.retrieve(id)`) when you need current state, instead of trusting the snapshot in an older event.
6. If a handler is slow (sending email, calling other APIs), enqueue a job (Celery, RQ, or a jobs table) and return 200.

### Output
`webhook_handler` and `processed_events_table`.

### Quality Gate
- `stripe events resend evt_...` for an already processed event leaves the count from `SELECT count(*) FROM stripe_processed_events WHERE event_id='evt_...'` at 1 and causes no second business update.
- A pytest test posts a correctly signed payload (build the header with `stripe.WebhookSignature._compute_signature` only if your library version has it; otherwise compute HMAC-SHA256 of `"{t}.{payload}"` yourself) and asserts 200.

---

## Phase 3: Register the Endpoint

### Entry Criteria
- Tests pass locally (`pytest -q` exit code 0).

### Actions
1. Register the deployed URL in test mode with only the events the app handles: `stripe post /v1/webhook_endpoints -d url=https://app.example.com/webhooks/stripe -d "enabled_events[]=invoice.paid" -d "enabled_events[]=customer.subscription.updated" ...`. Set `api_version` on the endpoint equal to the app's pinned version so payload shapes match.
2. Store the returned `secret` in the deployment's secret store as `STRIPE_WEBHOOK_SECRET`.
3. Do not register `*` (all events); it adds load and payload shapes you have not tested.

### Output
Registered endpoint ID `we_...`.

### Quality Gate
- Dashboard > Developers > Webhooks shows the endpoint with zero failed deliveries after `stripe trigger invoice.paid` against the deployed test environment.

---

## Worked Example

Illustrative only.

FastAPI app. Phase 1: `stripe listen --forward-to localhost:8000/webhooks/stripe` prints `Ready! Your webhook signing secret is whsec_abc...`; `stripe trigger customer.created` shows `--> customer.created [evt_1Q...]` and `<-- [200] POST http://localhost:8000/webhooks/stripe`. Phase 2: resend of `evt_1Q...` returns 200 and the count query returns 1.

---

## Exit Criteria

DONE when the endpoint rejects bad signatures, processes each event id once inside a transaction, and is registered with only handled events.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Every event fails signature | **Adjust**: confirm the raw bytes are used and the secret is from this `stripe listen` session or this endpoint. |
| Phase 2 | Duplicate business updates on resend | **Adjust**: move the dedupe insert into the same transaction as the update. |
| Phase 2 | Handler times out | **Adjust**: enqueue the work and return 200 first. |
| Phase 3 | Payload shape differs from local tests | **Stop**: the endpoint `api_version` differs from the app's; align them. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
