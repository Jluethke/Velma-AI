# Node.js Stripe Webhook Endpoint

**One-line description:** Builds a Node.js (Express or Next.js route handler) Stripe webhook endpoint that verifies the Stripe-Signature header against the raw body with stripe.webhooks.constructEvent, deduplicates by event id in PostgreSQL, and returns 2xx before slow work.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `stripe_api_version` (string, optional): API version passed as `apiVersion` to `new Stripe(key, { apiVersion })`. Default: the version the installed `stripe` package pins, recorded.
- `app_framework` (string, required): "express" or "nextjs".
- `database_url` (string, required): PostgreSQL connection URL.

---

## Outputs

- `webhook_handler` (string): Path to the route module and its handler map, for example `src/billing/webhooks.ts`.
- `processed_events_table` (string): Name and DDL of the dedupe table, `stripe_processed_events`.

---

## Phase 1: Raw Body and Signature

### Entry Criteria
- `npm ls stripe` prints a version. Record it.
- `STRIPE_WEBHOOK_SECRET` (`whsec_...`) is in the environment.

### Actions
1. Express: mount the route with `express.raw({ type: 'application/json' })` and register it before any global `app.use(express.json())`, or the body arrives already parsed and verification fails.
   ```js
   app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
     let event;
     try {
       event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
     } catch (err) {
       return res.status(400).send(`Webhook Error: ${err.message}`);
     }
     ...
   });
   ```
2. Next.js App Router (`app/api/webhooks/stripe/route.ts`): read `const body = await req.text()` and pass that string to `constructEvent`. Never call `req.json()` first.
3. On edge runtimes without Node crypto, use `stripe.webhooks.constructEventAsync` with `Stripe.createSubtleCryptoProvider()`; check the library README for your version.
4. Run `stripe listen --forward-to localhost:3000/webhooks/stripe` (or `/api/webhooks/stripe`).

### Output
Endpoint that returns 400 on bad signatures.

### Quality Gate
- `stripe trigger customer.created` shows `<-- [200]` in `stripe listen`.
- `curl -s -o /dev/null -w "%{http_code}" -X POST localhost:3000/webhooks/stripe -H "Stripe-Signature: t=1,v1=bad" -H "Content-Type: application/json" -d "{}"` prints 400.

---

## Phase 2: Dedupe and Dispatch

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Add a migration (Prisma, Knex, Drizzle or node-pg-migrate, whichever the app uses) creating:
   ```sql
   CREATE TABLE stripe_processed_events (event_id text PRIMARY KEY, type text NOT NULL, received_at timestamptz NOT NULL DEFAULT now());
   ```
2. In one transaction: `INSERT ... ON CONFLICT (event_id) DO NOTHING RETURNING event_id`; if `rowCount === 0`, commit and return 200; otherwise run the handler's database writes, then commit.
3. Dispatch with `const handlers: Record<string, (e: Stripe.Event) => Promise<void>> = { 'invoice.paid': onInvoicePaid, ... }`. Unknown types: log and return 200.
4. Events are unordered. Re-fetch current objects (`await stripe.subscriptions.retrieve(id)`) when state matters.
5. Push slow work (email, third-party calls) to a queue (BullMQ or a jobs table) and return 200.

### Output
`webhook_handler` and `processed_events_table`.

### Quality Gate
- `stripe events resend evt_...` leaves `SELECT count(*) FROM stripe_processed_events WHERE event_id='evt_...'` at 1.
- A test using `stripe.webhooks.generateTestHeaderString({ payload, secret })` posts a signed body and asserts 200; the test runner (`npx vitest run` or `npx jest`) exits 0.

---

## Phase 3: Register the Endpoint

### Entry Criteria
- Tests pass.

### Actions
1. `stripe post /v1/webhook_endpoints -d url=https://app.example.com/webhooks/stripe -d "enabled_events[]=invoice.paid" ... -d api_version=<pinned version>`.
2. Store the returned `secret` as `STRIPE_WEBHOOK_SECRET` in the deployment's secret store.
3. List only handled events; do not enable all events.

### Output
Registered endpoint `we_...`.

### Quality Gate
- After `stripe trigger invoice.paid` against the deployed test environment, the endpoint shows no failed deliveries in Dashboard > Developers > Webhooks.

---

## Worked Example

Illustrative only.

Express app. Phase 1: first attempt returns 400 "No signatures found matching the expected signature for payload" because `express.json()` ran globally; moving the route above it gives `<-- [200]`. Phase 2: `generateTestHeaderString` test passes; resend count stays 1.

---

## Exit Criteria

DONE when the endpoint verifies the raw body, processes each event id once in a transaction, and is registered with only handled events.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | "No signatures found matching" | **Adjust**: a JSON parser ran first; mount `express.raw` on this route before `express.json`. |
| Phase 1 | `constructEvent` crypto error on edge | **Adjust**: use `constructEventAsync` with the SubtleCrypto provider. |
| Phase 2 | Duplicate processing | **Adjust**: put the dedupe insert in the same transaction as the writes. |
| Phase 3 | Deliveries time out | **Adjust**: return 200 before slow work; enqueue it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
