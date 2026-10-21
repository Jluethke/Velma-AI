# Stripe Checkout Session with Webhook Fulfillment

**One-line description:** Creates a Stripe-hosted Checkout Session from server-side line items, redirects the buyer, and fulfills only from `checkout.session.completed` (when `payment_status` is `paid`) or `checkout.session.async_payment_succeeded`, never from the success page.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `test_env` (object, required): Output of `pay-test-mode-setup`.
- `currency_exponents` (object, required): Output of `pay-money-minor-units`.

---

## Outputs

- `checkout_session_endpoint` (object): Route, file, session parameters used, the fulfillment function name, and test evidence for paid, async and expired cases.

---

## Phase 1: Create the Session Server Side

### Entry Criteria
- SDK installed; test key configured.

### Actions
1. Prefer Stripe Price objects (`price_...`) created in the Dashboard or API, referenced by id. If you use inline `price_data`, set `unit_amount` as an integer in minor units from `currency_exponents`.
2. Create the session (Python shown; Node is `stripe.checkout.sessions.create({...}, { idempotencyKey })`; Go is `session.New(&stripe.CheckoutSessionParams{...})` in package `checkout/session`):
   ```python
   s = stripe.checkout.Session.create(
       mode="payment",
       line_items=[{"price": "price_123", "quantity": 1}],
       success_url="https://shop.example/thanks?session_id={CHECKOUT_SESSION_ID}",
       cancel_url="https://shop.example/cart",
       client_reference_id=str(order.id),
       metadata={"order_id": str(order.id)},
       idempotency_key=f"cs-create:{order.id}:v1",
   )
   ```
   `{CHECKOUT_SESSION_ID}` is a literal template Stripe fills in; keep the braces exactly.
3. Store `s.id` (`cs_...`) on the order. Respond with HTTP 303 redirect to `s.url`.
4. Session `mode` table:
   | Need | `mode` |
   |---|---|
   | One-time payment | `payment` |
   | Save card, no charge now | `setup` |
   | Recurring price | `subscription` |

### Output
Session creation route.

### Quality Gate
- Requesting the route in a browser lands on a `checkout.stripe.com` page showing the expected total.
- The order row holds a `cs_` id.

---

## Phase 2: Fulfill From Webhooks Only

### Entry Criteria
- A verified webhook handler exists (run the stack webhook flow first) and `stripe listen` is forwarding.

### Actions
1. Write one function `fulfill_checkout(session_id)` that: retrieves the session with `expand=["line_items"]`, returns early if the order is already fulfilled, checks `session.payment_status`, and fulfills only when it is `paid` (or `no_payment_required` for a zero total you allow).
2. Call it from these events:
   | Event | Action |
   |---|---|
   | `checkout.session.completed` | `fulfill_checkout`; if `payment_status` is `unpaid` (delayed methods like bank debits), mark order `awaiting_payment` |
   | `checkout.session.async_payment_succeeded` | `fulfill_checkout` |
   | `checkout.session.async_payment_failed` | Mark order `payment_failed`; email the buyer |
   | `checkout.session.expired` | Mark order `abandoned`; release reserved stock |
3. The success page may display status by retrieving the session, but must not fulfill. A buyer can close the tab before redirect, and anyone can open the URL.
4. Make `fulfill_checkout` safe to call twice: guard with a database unique constraint or a conditional update `UPDATE orders SET status='fulfilled' WHERE id=? AND status<>'fulfilled'` and check the affected row count.

### Output
Fulfillment wired.

### Quality Gate
- `rg -n "fulfill" <success page handler>` returns no call to the fulfillment function.
- Calling `fulfill_checkout` twice in a test results in one fulfillment record.

---

## Phase 3: Test Each Path

### Entry Criteria
- Phases 1 and 2 done.

### Actions
1. Paid path: complete Checkout with `4242 4242 4242 4242`. Expect `checkout.session.completed` `[200]` in `stripe listen`, order `fulfilled`.
2. Expired path: create a session and expire it with `stripe checkout sessions expire cs_...` (or the API `Session.expire`). Expect `checkout.session.expired` and order `abandoned`.
3. Async path: if you enable a delayed payment method, run `stripe trigger checkout.session.async_payment_succeeded` if your CLI lists it in `stripe trigger --help`; otherwise record as untested.
4. Record every result in `checkout_session_endpoint`.

### Output
`checkout_session_endpoint`.

### Quality Gate
- `stripe listen` shows `[200]` for each tested event.
- Database query `SELECT status FROM orders WHERE id=<test id>` returns the expected status for each path.

---

## Worked Example

Illustrative. Python Flask, `price_1Q...` at 4900 USD.

- Phase 1: browser redirected to `https://checkout.stripe.com/c/pay/cs_test_a1...`.
- Phase 2: listen output `--> checkout.session.completed [evt_1Q...]`, `<-- [200] POST http://localhost:4242/webhook`.
- Phase 3: `SELECT status FROM orders WHERE id=8812` returns `fulfilled`; after `stripe checkout sessions expire cs_test_b2...`, order 8813 returns `abandoned`.

---

## Exit Criteria

DONE when sessions are created server side, fulfillment runs only from the listed webhooks, is idempotent, and the paid and expired paths are verified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `No such price` | **Adjust**: the price id is from the other mode (test vs live); create it in test mode. |
| Phase 1 | `{CHECKOUT_SESSION_ID}` arrives URL-encoded | **Adjust**: build the string without passing it through a URL encoder. |
| Phase 2 | Order fulfilled twice | **Stop**: add the conditional update guard and its test. |
| Phase 3 | Expire command not in your CLI | **Adjust**: call the expire endpoint through the SDK in a script or test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
