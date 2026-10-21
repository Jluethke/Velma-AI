# Paddle Billing Catalog and Webhooks

**One-line description:** Creates the Paddle Billing product and price catalog from the pricing spec through the Paddle API and implements Paddle-Signature webhook verification with handlers for subscription and transaction events, including plan changes with an explicit proration mode.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `pricing_spec` (object, required): From `bill-pricing-model-spec`.
- `paddle_environment` (string, required): "sandbox" (base URL `https://sandbox-api.paddle.com`) or "production" (`https://api.paddle.com`). Always build in sandbox first.

---

## Outputs

- `paddle_catalog` (object[]): Spec `key` to Paddle `pro_...` product ID and `pri_...` price ID, with billing cycle and amount as returned by the API.
- `paddle_webhook_code` (string): Path to the webhook endpoint module, its tests, and the list of subscribed event types.

---

## Phase 1: Create Products and Prices

### Entry Criteria
- `pricing_spec` present. This is Paddle Billing (IDs start with `pro_`, `pri_`, `sub_`, `txn_`), not Paddle Classic. If the account dashboard is Paddle Classic, stop.
- An API key from Paddle > Developer tools > Authentication is stored in an environment variable `PADDLE_API_KEY`, never in code.

### Actions
1. Create one product per spec product:
   `curl -s -X POST $BASE/products -H "Authorization: Bearer $PADDLE_API_KEY" -H "Content-Type: application/json" -d '{"name":"Pro","tax_category":"saas"}'`
   Confirm `tax_category` against the current Paddle docs list; Paddle uses it to tax the sale as merchant of record.
2. Create each recurring price:
   `curl -s -X POST $BASE/prices -H "Authorization: Bearer $PADDLE_API_KEY" -H "Content-Type: application/json" -d '{"product_id":"pro_...","description":"Pro monthly","unit_price":{"amount":"2000","currency_code":"USD"},"billing_cycle":{"interval":"month","frequency":1}}'`
   `unit_price.amount` is a string in minor units. Add `"trial_period":{"interval":"day","frequency":N}` only when the spec row has `trial_days` = N.
3. For `per_seat` rows, set `quantity` limits on the price (`{"minimum":1,"maximum":M}`) where M comes from the spec; check the field in the Prices API reference.
4. For `usage` rows: Paddle Billing has no meter object. Record usage charges as one-time charges on the subscription (`POST /subscriptions/{subscription_id}/charge`) with a non-recurring price; confirm the request body in the API reference before coding it.
5. For `graduated` or `volume` rows, check the Paddle docs for tiered price support. If unsupported, stop and return the row to `pricing_open_questions`; do not approximate.
6. List back with `curl -s "$BASE/prices?product_id=pro_..." -H "Authorization: Bearer $PADDLE_API_KEY"` and write `paddle_catalog`.

### Output
`paddle_catalog`.

### Quality Gate
- Every non-usage spec row has a `pri_` ID, and the listed `unit_price.amount` equals the spec's `unit_amount_minor` as a string.
- No API key appears in any committed file (`git grep -n "pdl_"` returns nothing; Paddle keys carry that prefix, check your key's prefix if different).

---

## Phase 2: Verify Webhooks

### Entry Criteria
- A notification destination is created in Paddle > Developer tools > Notifications with the endpoint URL, and its secret key is stored in `PADDLE_WEBHOOK_SECRET`.

### Actions
1. Read the raw request body as bytes before any JSON parsing. A parsed-then-reserialized body fails verification.
2. Parse the `Paddle-Signature` header, format `ts=<unix>;h1=<hex>`. Split on `;` then on `=`.
3. Compute HMAC-SHA256 with key `PADDLE_WEBHOOK_SECRET` over the string `<ts>:<raw body>`, hex encode, and compare to `h1` with a constant-time compare (`hmac.compare_digest` in Python, `crypto.timingSafeEqual` in Node). Reject on mismatch with HTTP 400.
4. Reject a `ts` older than the tolerance your code sets; the official SDKs (`paddle-python-sdk`, `@paddle/paddle-node-sdk`) provide verifiers with a default tolerance, prefer them over hand-rolled code.
5. Store `event_id` in a processed-events table with a unique constraint; on conflict return 200 and do nothing.
6. Return 200 within the time limit stated in Paddle's webhook docs, then process.

### Output
Verified, deduplicated webhook endpoint.

### Quality Gate
- A test posting a body with a wrong `h1` gets 400; a test with a correct signature gets 200.
- Posting the same event twice inserts one row in the processed-events table.

---

## Phase 3: Handle Subscription Events and Plan Changes

### Entry Criteria
- Phase 2 tests pass.

### Actions
1. Map events to actions:

| Event | Action |
|---|---|
| `subscription.created` | Store `sub_` ID, customer `ctm_` ID, items and status; grant entitlements. |
| `subscription.updated` | Replace stored items and status; recompute entitlements. |
| `subscription.past_due` | Apply the past-due access rule from the access policy. |
| `subscription.canceled` | Revoke at `canceled_at`/period end per stored data. |
| `transaction.completed` | Mark the period paid. |
| `transaction.payment_failed` | Notify the customer; Paddle runs its own dunning as merchant of record. |

2. Events can arrive out of order. Compare the event's `occurred_at` with the stored `last_event_at` per subscription and ignore older events.
3. Plan change: call `PATCH /subscriptions/{id}/preview` first with the new `items` and a `proration_billing_mode`, show the customer the preview amounts, then `PATCH /subscriptions/{id}` with the same body. Choose the mode by table:

| Policy | `proration_billing_mode` |
|---|---|
| Upgrade charged now, prorated | `prorated_immediately` |
| Change prorated on next bill | `prorated_next_billing_period` |
| Full price now, no proration | `full_immediately` |
| Change without any charge | `do_not_bill` |

4. Customer portal: create a session with `POST /customers/{customer_id}/portal-sessions` and redirect to the returned URL.
5. Use the Paddle sandbox webhook simulator (Developer tools > Simulations) to send each event type to the endpoint and check the stored state after each.

### Output
`paddle_webhook_code`.

### Quality Gate
- One simulator run per event type in the table; the stored subscription status after each matches the table action.
- A test replays an older `subscription.updated` after a newer one; stored state keeps the newer values.

---

## Worked Example

Illustrative only.

Spec row `pro_monthly_usd` 2000 USD monthly. Phase 1: `POST /prices` returns `{"data":{"id":"pri_01h...","unit_price":{"amount":"2000","currency_code":"USD"},"billing_cycle":{"interval":"month","frequency":1}}}`. Phase 2: test with header `Paddle-Signature: ts=1730000000;h1=deadbeef` returns 400. Phase 3: preview for upgrade to `pri_team` with `prorated_immediately` returns an `immediate_transaction` with the prorated total; the PATCH then returns status `active` with the new item.

---

## Exit Criteria

DONE when every spec price exists in Paddle sandbox, the webhook endpoint rejects bad signatures and duplicates, and every mapped event updates stored state as tabled.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | API returns 403 | **Stop**: the key lacks permission or targets the other environment; check `paddle_environment`. |
| Phase 1 | Tiered or usage model unsupported | **Return**: send the row back to `bill-pricing-model-spec` as an open question. |
| Phase 2 | All signatures fail | **Adjust**: confirm the raw body is used and the secret belongs to this notification destination. |
| Phase 3 | Out-of-order event overwrote newer state | **Retry**: add the `occurred_at` comparison and rerun the replay test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
