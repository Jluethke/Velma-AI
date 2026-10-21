# Node.js Stripe PaymentIntent Endpoint

**One-line description:** Builds a Node.js server route (Express or Next.js App Router) that prices the cart server side in integer minor units, creates a Stripe PaymentIntent with a stored idempotency key, returns only the `client_secret`, and is covered by a test-mode integration test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root of the Node app.
- `test_env` (object, required): Output of `pay-test-mode-setup`.
- `currency_exponents` (object, required): Output of `pay-money-minor-units`.
- `idempotency_audit` (object[], required): Output of `pay-idempotency-keys`.

---

## Outputs

- `payment_intent_endpoint` (object): Route path, file, request and response JSON shape, and the passing test command with its summary line.

---

## Phase 1: Server-Side Amount and Order Row

### Entry Criteria
- `npm ls stripe` prints a version. `STRIPE_SECRET_KEY` starts with `sk_test_`.

### Actions
1. Initialize the client once in its own module, for example `lib/stripe.ts`: `import Stripe from 'stripe'; export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { maxNetworkRetries: 2 });`. If you pin an API version, set `apiVersion` to the value your installed SDK's types accept; the TypeScript compiler rejects other strings, which is the check.
2. The browser sends item ids and quantities only. Look prices up server side.
3. Compute `amount` with the integer helper from `pay-money-minor-units`; assert `Number.isSafeInteger(amount) && amount > 0`.
4. Create or load the order row with `piCreateKey = \`pi-create:${order.id}:v1\`` and `paymentIntentId = null`; persist before calling Stripe.

### Output
Order row with stored key.

### Quality Gate
- `rg -n "req\.body\.(amount|price)|body\.(amount|price)" <route file>` returns no matches.
- A unit test proves a known cart yields the expected integer amount.

---

## Phase 2: Create the PaymentIntent

### Entry Criteria
- Phase 1 passed.

### Actions
1. Create the intent:
   ```ts
   const pi = await stripe.paymentIntents.create(
     {
       amount: order.amount,
       currency: order.currency.toLowerCase(),
       automatic_payment_methods: { enabled: true },
       metadata: { order_id: String(order.id) },
     },
     { idempotencyKey: order.piCreateKey },
   );
   ```
   The idempotency key is in the second argument (request options), not inside the params object.
2. If `order.paymentIntentId` exists, `stripe.paymentIntents.retrieve(order.paymentIntentId)` and return that client secret instead.
3. Return `{ clientSecret: pi.client_secret }` and nothing else from the object.
4. Route declaration:
   | Framework | Where |
   |---|---|
   | Express | `app.post('/create-payment-intent', express.json(), handler)` |
   | Next.js App Router | `app/api/create-payment-intent/route.ts` exporting `export async function POST(req: Request)`; read body with `await req.json()` |
5. Catch errors: `if (err instanceof Stripe.errors.StripeError)` log `err.type`, `err.code`, `err.requestId`; respond 502 with a generic message.
6. Do not fulfill the order here. Fulfillment waits for the verified `payment_intent.succeeded` webhook.

### Output
Working route.

### Quality Gate
- `curl -s -X POST localhost:<port>/create-payment-intent -H "Content-Type: application/json" -d '{"items":[{"id":"sku_1","qty":1}]}'` returns JSON whose `clientSecret` contains `_secret_`.
- `npx tsc --noEmit` exits 0 (TypeScript projects).

---

## Phase 3: Integration Test

### Entry Criteria
- Route returns a client secret.

### Actions
1. With the project's test runner (Vitest or Jest), call the handler twice for one order and assert one PaymentIntent id is stored.
2. Confirm server side in test mode: `await stripe.paymentIntents.confirm(id, { payment_method: 'pm_card_visa', return_url: 'https://example.com/return' })`; assert `status === 'succeeded'`.
3. Run `npx vitest run test/payment-intent.test.ts` (or `npx jest test/payment-intent.test.ts`) and record the summary.

### Output
`payment_intent_endpoint`.

### Quality Gate
- Runner summary shows the new tests passed, zero failed.
- `stripe payment_intents list --limit 3` shows one intent with the test order id in metadata.

---

## Worked Example

Illustrative. Next.js App Router, one item priced 2500 EUR minor units.

- Phase 1: order 41 created, key `pi-create:41:v1`.
- Phase 2: `curl` returns `{"clientSecret":"pi_3Qd..._secret_k2..."}`.
- Phase 3:
```
 ✓ test/payment-intent.test.ts (2 tests) 2870ms
 Test Files  1 passed (1)
      Tests  2 passed (2)
```

---

## Exit Criteria

DONE when the route returns only a client secret for a server-priced, idempotent PaymentIntent and the integration test passes in test mode.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | TypeScript rejects `apiVersion` string | **Adjust**: remove the option or use the value the installed types list; never cast it with `as any`. |
| Phase 2 | `idempotency_error` | **Adjust**: parameters changed under one key; apply the version-bump rule. |
| Phase 2 | `amount_too_small` | **Return**: surface to the buyer; the currency minimum is documented by Stripe. |
| Phase 3 | Two intents created | **Stop**: add the reuse check from Phase 2 step 2. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
