# Python Stripe PaymentIntent Endpoint

**One-line description:** Builds a Python server endpoint (Flask, FastAPI or Django) that computes the amount server side in minor units, creates a Stripe PaymentIntent with a stored idempotency key, returns only the `client_secret`, and is covered by a test-mode integration test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root of the Python app.
- `test_env` (object, required): Output of `pay-test-mode-setup`.
- `currency_exponents` (object, required): Output of `pay-money-minor-units`.
- `idempotency_audit` (object[], required): Output of `pay-idempotency-keys`; gives the key recipe for `pi-create`.

---

## Outputs

- `payment_intent_endpoint` (object): Route path, file, the request and response JSON shape, and the passing test command with its summary line.

---

## Phase 1: Server-Side Amount and Order Row

### Entry Criteria
- `pip show stripe` prints a version. `STRIPE_SECRET_KEY` starts with `sk_test_`.

### Actions
1. Read the installed SDK version with `pip show stripe`. Open the stripe-python README or changelog for that version and confirm which call style it documents: module style `stripe.PaymentIntent.create(...)` or client style `stripe.StripeClient(...)`. Use one style for the whole app. Do not mix them and do not invent method names.
2. The request body from the browser carries only cart item ids and quantities, never a price or amount. Look prices up from your database.
3. Compute `amount` as an integer in minor units with the helper from `pay-money-minor-units`. Assert `isinstance(amount, int) and amount > 0`.
4. Insert or load an order row with fields `id`, `amount`, `currency`, `status='pending'`, `pi_create_key` set to `f"pi-create:{order.id}:v1"`, and `payment_intent_id` (null for now). Commit before calling Stripe.

### Output
Order row with a stored key and server-computed amount.

### Quality Gate
- `rg -n "request.*(amount|price)" <endpoint file>` returns no line that reads an amount from the client.
- A unit test proves a cart of known items yields the expected integer `amount`.

---

## Phase 2: Create the PaymentIntent

### Entry Criteria
- Phase 1 passed.

### Actions
1. Module style example (adjust only names to your app):
   ```python
   import os, stripe
   stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
   stripe.max_network_retries = 2
   pi = stripe.PaymentIntent.create(
       amount=order.amount,
       currency=order.currency.lower(),
       automatic_payment_methods={"enabled": True},
       metadata={"order_id": str(order.id)},
       idempotency_key=order.pi_create_key,
   )
   ```
2. Save `pi.id` to `order.payment_intent_id`. If the order already has a `payment_intent_id`, retrieve it with `stripe.PaymentIntent.retrieve(order.payment_intent_id)` and return its `client_secret` instead of creating a new one.
3. Return JSON `{"clientSecret": pi.client_secret}`. Never return the secret key, the full PaymentIntent object, or anything from `STRIPE_SECRET_KEY`.
4. Framework route:
   | Framework | Route declaration |
   |---|---|
   | Flask | `@app.post("/create-payment-intent")` |
   | FastAPI | `@app.post("/create-payment-intent")` with a Pydantic body model of item ids |
   | Django | a view in `views.py` registered in `urls.py`, `require_POST`, CSRF protection kept on for this browser-called route |
5. Catch `stripe.error.StripeError` (newer SDKs also expose `stripe.StripeError`; use what your version documents). Log `e.user_message`, `e.code` and `e.request_id`; return HTTP 502 with a generic message.
6. Do not mark the order paid here. Fulfillment happens only from the verified `payment_intent.succeeded` webhook.

### Output
Working endpoint.

### Quality Gate
- `curl -s -X POST localhost:<port>/create-payment-intent -H "Content-Type: application/json" -d '{"items":[{"id":"sku_1","qty":1}]}'` prints JSON with a `clientSecret` that starts with `pi_` and contains `_secret_`.
- The response contains no key starting with `sk_`.

---

## Phase 3: Integration Test

### Entry Criteria
- Endpoint returns a client secret.

### Actions
1. Write a pytest test that calls the endpoint twice for the same order and asserts the same PaymentIntent id is used (read it from the order row).
2. In the same test, confirm the intent server side using the test payment method token: `stripe.PaymentIntent.confirm(pi_id, payment_method="pm_card_visa", return_url="https://example.com/return")`. Assert `status == "succeeded"`.
3. Run `pytest -q tests/test_payment_intent.py` and record the summary line.

### Output
`payment_intent_endpoint`.

### Quality Gate
- `pytest` summary shows the new tests passed with zero failures.
- The Stripe Dashboard test-mode Payments list shows exactly one PaymentIntent for the test order (or `stripe payment_intents list --limit 3` shows one with the test order id in metadata).

---

## Worked Example

Illustrative. FastAPI app, cart `[{"id":"course-12","qty":1}]`, price 4900 USD minor units.

- Phase 1: order 8812 created, `pi_create_key` = `pi-create:8812:v1`.
- Phase 2: `curl` returns `{"clientSecret":"pi_3QabC..._secret_XyZ..."}`.
- Phase 3:
```
$ pytest -q tests/test_payment_intent.py
..                                                     [100%]
2 passed in 3.41s
```

---

## Exit Criteria

DONE when the endpoint returns only a client secret for a server-priced, idempotent PaymentIntent and the pytest integration test passes in test mode.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `AttributeError` on a stripe call | **Adjust**: your SDK version uses the other call style; reread its README and use that style throughout. |
| Phase 2 | `InvalidRequestError` "amount must be at least" | **Return**: the amount is below the documented minimum for that currency; show the buyer a message, do not round up silently. |
| Phase 2 | `IdempotencyError` | **Adjust**: the stored key was reused with a different amount; follow the version-bump rule from `pay-idempotency-keys`. |
| Phase 3 | Test creates two PaymentIntents | **Stop**: the reuse check in Phase 2 step 2 is missing; fix before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
