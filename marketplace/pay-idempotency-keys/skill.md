# Idempotency Keys on Every Mutating Payment Call

**One-line description:** Finds every create, confirm, capture, refund and update call to the payment provider, attaches an idempotency key derived from a stable business identifier, and proves with a double-submit test that a retried request creates one object, not two.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `provider` (string, required): `stripe`, `paypal` or `adyen`.

---

## Outputs

- `idempotency_audit` (object[]): One row per mutating call site: file, line, API call, key source, status (`missing`, `random_per_attempt`, `stable`), and test evidence.

---

## Phase 1: Inventory Mutating Calls

### Entry Criteria
- Repository builds and tests pass before changes (record the command).

### Actions
1. Search for provider calls that change state (copy the command for your stack exactly):
   - python: `rg -n "stripe\.\w+\.(create|modify|confirm|capture|cancel)\(|client\.\w+\.\w+\.(create|update|confirm|capture|cancel)\(" --type py`
   - node: `rg -n "stripe\.\w+\.(create|update|confirm|capture|cancel)\(" --type js --type ts`
   - go: `rg -n "\b(paymentintent|refund|setupintent|customer|session)\.(New|Confirm|Capture|Cancel|Update)\(" --type go`
   - PayPal (any stack): `rg -n "/v2/checkout/orders|/capture|/refund"`
   - Adyen (any stack): `rg -n "/sessions|/payments|/refunds|/captures|/cancels"`
2. List each hit in `idempotency_audit` with status `missing` until you read the call.

### Output
Inventory.

### Quality Gate
- Every hit from the search output has a row.

---

## Phase 2: Choose the Key Source per Call

### Entry Criteria
- Inventory complete.

### Actions
1. Read each call and set its status:
   | Code pattern | Status |
   |---|---|
   | No idempotency option passed | `missing` |
   | Key is `uuid4()` or `crypto.randomUUID()` generated inside the retry loop or per HTTP request | `random_per_attempt` (a client retry after a timeout sends a new key and charges twice) |
   | Key built from a stored business id and the operation, created once and reused on retry | `stable` |
2. Key recipe: `"<operation>:<business_id>:<attempt_group>"`, for example `"pi-create:order_8812:v1"` or `"refund:order_8812:line_3:v1"`. Store the key on the order row before calling the provider so a crash and restart reuses it.
3. Provider rules to respect (from each provider's API docs):
   | Provider | Header or option | Rule to note |
   |---|---|---|
   | Stripe | `Idempotency-Key` header; Python `idempotency_key=`, Node `{ idempotencyKey }` as the second argument, Go `params.SetIdempotencyKey(k)` | Up to 255 characters. Reusing a key with different parameters returns an idempotency error. Keys may be pruned after at least 24 hours. A result is saved only once the endpoint started executing. |
   | PayPal | `PayPal-Request-Id` header | Read the retention period in the PayPal REST docs for the endpoint you call. |
   | Adyen | `Idempotency-Key` header | Read Adyen's API idempotency page for key length and retention. |
4. Bump the `v1` suffix only when the business intentionally makes a new attempt with new parameters (for example the buyer changed the cart).

### Output
Updated audit with a planned key per call.

### Quality Gate
- Every row has a status and a key recipe.
- Zero rows plan a key generated per attempt.

---

## Phase 3: Apply and Prove

### Entry Criteria
- Phase 2 complete. Test-mode keys configured.

### Actions
1. Change one call site per commit. Examples:
   - Python: `stripe.PaymentIntent.create(amount=1999, currency="usd", automatic_payment_methods={"enabled": True}, idempotency_key=order.pi_create_key)`
   - Node: `await stripe.paymentIntents.create({ amount: 1999, currency: 'usd', automatic_payment_methods: { enabled: true } }, { idempotencyKey: order.piCreateKey })`
   - Go: `params.SetIdempotencyKey(order.PICreateKey); pi, err := paymentintent.New(params)`
2. Write a test against test mode that calls the same code path twice with the same order. Assert both returns have the same object id (for Stripe, `pi_...` equal).
3. Write a second test that changes the amount but keeps the key; assert the provider returns an idempotency error and your code surfaces it instead of retrying with a fresh key.
4. Enable SDK network retries where available (Python `stripe.max_network_retries = 2`, Node `require('stripe')(key, { maxNetworkRetries: 2 })`; check your SDK README for the option name). The SDKs send idempotency keys on their own retries, but your stored key is what protects a retry from your own job queue.
5. Run the full suite.

### Output
Final `idempotency_audit` with test evidence.

### Quality Gate
- Both tests pass; the first prints identical ids in its assertion message or log.
- Rerunning the Phase 1 search and reading each hit shows every row `stable`.

---

## Worked Example

Illustrative. `stack` = `node`, `provider` = `stripe`.

- Phase 1: 3 hits: `paymentIntents.create` (checkout.ts:52), `refunds.create` (refund.ts:18), `paymentIntents.update` (checkout.ts:77).
- Phase 2: checkout.ts:52 uses `crypto.randomUUID()` per request, status `random_per_attempt`; planned key `pi-create:${order.id}:v1`.
- Phase 3: test output:
```
 PASS  test/idempotency.test.ts
  ✓ same key returns same PaymentIntent (pi_3Q... === pi_3Q...)
  ✓ same key with different amount surfaces idempotency_error
```

---

## Exit Criteria

DONE when every mutating provider call sends a stable stored key and the double-submit and mismatch tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Calls hidden behind a wrapper | **Adjust**: add the key at the wrapper and pass it from every caller. |
| Phase 2 | No stable business id exists | **Return**: create an order or attempt row first; never key on a timestamp. |
| Phase 3 | Same-key test returns two ids | **Stop**: the key is not reaching the request; log the outgoing headers in test mode and fix. |
| Phase 3 | Idempotency error in production logs | **Adjust**: a retry changed parameters; reuse the original parameters or bump the version suffix deliberately. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
