# Node.js Stripe Webhook Signature Verification

**One-line description:** Builds an Express, Next.js or Fastify webhook route that receives the unparsed request body as a Buffer or string, verifies it with `stripe.webhooks.constructEvent`, returns 2xx fast, and is proven with valid and tampered signatures.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root of the Node app.
- `node_framework` (string, required): `express`, `nextjs-app`, `nextjs-pages` or `fastify`.
- `webhook_secret_local` (string, required): Confirmation from `pay-stripe-cli-local-webhooks` that `STRIPE_WEBHOOK_SECRET` is set.

---

## Outputs

- `webhook_handler` (object): File, route, framework, raw-body method, dispatched event types, and verification test results.

---

## Phase 1: Get the Raw Body Per Framework

### Entry Criteria
- `STRIPE_WEBHOOK_SECRET` starts with `whsec_`.

### Actions
1. Apply the row for `node_framework`:
   | Framework | Raw body setup | Body variable |
   |---|---|---|
   | express | `app.post('/webhook', express.raw({ type: 'application/json' }), handler)` and register this route BEFORE any global `app.use(express.json())`, or exclude the path from it | `req.body` (a Buffer) |
   | nextjs-app | `app/api/webhook/route.ts` with `export async function POST(req: Request)` | `const body = await req.text()` |
   | nextjs-pages | `pages/api/webhook.ts` with `export const config = { api: { bodyParser: false } }`; read the stream into a Buffer (for example with a `for await (const chunk of req)` loop) | the collected Buffer |
   | fastify | Register a content type parser for `application/json` with `{ parseAs: 'buffer' }` scoped to the webhook route's plugin, or use the `fastify-raw-body` plugin | `request.body` or `request.rawBody` per the method chosen |
2. Read the signature: `req.headers['stripe-signature']` (Express, Next pages, Fastify) or `req.headers.get('stripe-signature')` (Next app router).
3. Check for global body parsers: `rg -n "express\.json\(|bodyParser\.json\(|addContentTypeParser" <src>`.

### Output
Route receiving raw bytes.

### Quality Gate
- In a debug run, `Buffer.isBuffer(req.body)` logs `true` (Express) or `typeof body === 'string'` logs `true` (Next app router) for one forwarded event; remove the debug line after.

---

## Phase 2: Verify and Dispatch

### Entry Criteria
- Phase 1 passed.

### Actions
1. Verify:
   ```ts
   let event: Stripe.Event;
   try {
     event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
   } catch (err) {
     return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
   }
   ```
   On edge runtimes without Node crypto, use `await stripe.webhooks.constructEventAsync(...)` with `Stripe.createSubtleCryptoProvider()` as documented in stripe-node.
2. `switch (event.type)` to small functions; default case logs and returns 200.
3. Respond 200 quickly; enqueue slow work with `event.id`.
4. Log `event.id`, `event.type`, object id only.

### Output
Verified handler.

### Quality Gate
- `stripe trigger payment_intent.succeeded` produces `<-- [200]` in `stripe listen`.

---

## Phase 3: Prove Rejection

### Entry Criteria
- Phase 2 passed.

### Actions
1. `curl -s -o /dev/null -w "%{http_code}" -X POST localhost:<port>/webhook -H "Stripe-Signature: t=1,v1=bad" -H "Content-Type: application/json" -d '{}'` must print `400`.
2. Unit test: use `stripe.webhooks.generateTestHeaderString({ payload, secret })` to build a valid header; assert 200. Change one character of `payload` after signing; assert 400.
3. Run the test file with Vitest or Jest and record the summary.

### Output
`webhook_handler`.

### Quality Gate
- curl prints `400`.
- Test summary shows both signature tests passing.

---

## Worked Example

Illustrative. Express.

```js
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) { return res.status(400).send(`Webhook Error: ${err.message}`); }
  queue.add('stripe-event', { id: event.id, type: event.type });
  res.sendStatus(200);
});
app.use(express.json()); // after the webhook route
```
- Phase 3: curl prints `400`; `Tests  2 passed (2)`.

---

## Exit Criteria

DONE when the route verifies over raw bytes, returns 200 for valid events and 400 for tampered ones, proven by curl and unit tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | "Payload was provided as a parsed JavaScript object" error | **Adjust**: a JSON parser ran first; move the webhook route above it. |
| Phase 1 | Framework not listed | **Return**: find its raw-body option in its docs; never `JSON.stringify(req.body)` to rebuild bytes. |
| Phase 2 | "No signatures found matching the expected signature" | **Adjust**: wrong secret (CLI vs Dashboard) or modified body. |
| Phase 3 | Tampered payload accepted | **Stop**: verification is not running on this route; fix first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
