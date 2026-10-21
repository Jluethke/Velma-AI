# PayPal Orders v2 Create, Capture and Webhook Verification

**One-line description:** Integrates PayPal Checkout through the REST Orders v2 API in the sandbox: OAuth client-credentials token, create order with decimal-string amounts, capture with `PayPal-Request-Id`, and webhook verification through the verify-webhook-signature endpoint.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `currency_exponents` (object, required): Output of `pay-money-minor-units`.

---

## Outputs

- `paypal_integration` (object): Endpoints implemented, the minor-to-decimal conversion function, idempotency header usage, webhook verification result, and sandbox test results.

---

## Phase 1: Token and Amount Format

### Entry Criteria
- Sandbox REST app created in the PayPal developer dashboard; `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` in `.env`.

### Actions
1. Base URL: sandbox `https://api-m.sandbox.paypal.com`; live `https://api-m.paypal.com`. Choose by environment variable, never by hardcoding live.
2. Get a token: `curl -s -u "$PAYPAL_CLIENT_ID:$PAYPAL_CLIENT_SECRET" -d "grant_type=client_credentials" https://api-m.sandbox.paypal.com/v1/oauth2/token`. Read `access_token` and `expires_in`; cache the token until shortly before expiry.
3. Amount format pitfall: PayPal takes `amount.value` as a decimal STRING in major units (for example `"19.99"`, JPY `"500"`), not integer minor units. Write `minor_to_paypal(minor, currency)` that formats with exactly `iso_exponent` decimal places using integer math (for 2: `f"{minor // 100}.{minor % 100:02d}"`). Check PayPal's currency codes page for currencies that do not support decimals.
4. Unit test the function for every currency in `currency_exponents`.

### Output
Token helper and amount formatter.

### Quality Gate
- The curl in step 2 returns JSON with `access_token`.
- Formatter tests pass, including `1999 USD -> "19.99"` and `500 JPY -> "500"`.

---

## Phase 2: Create and Capture

### Entry Criteria
- Phase 1 passed.

### Actions
1. Create (server):
   ```
   POST /v2/checkout/orders
   Authorization: Bearer <token>
   PayPal-Request-Id: order-create:<order_id>:v1
   Content-Type: application/json
   {"intent":"CAPTURE","purchase_units":[{"reference_id":"<order_id>","amount":{"currency_code":"USD","value":"19.99"}}]}
   ```
   Store the PayPal order `id`. Return it to the browser (PayPal JS SDK `createOrder` callback returns this id).
2. Browser: PayPal JS SDK buttons, `onApprove` calls your server capture route with the order id.
3. Capture (server): `POST /v2/checkout/orders/{id}/capture` with header `PayPal-Request-Id: order-capture:<order_id>:v1`. Read `status` (`COMPLETED` on success) and `purchase_units[0].payments.captures[0].id` and `.status`.
4. Capture status rule:
   | Capture status | Action |
   |---|---|
   | `COMPLETED` | Mark paid (and still reconcile with webhook) |
   | `PENDING` | Mark awaiting; wait for `PAYMENT.CAPTURE.COMPLETED` webhook |
   | `DECLINED` or error `INSTRUMENT_DECLINED` | Let the buyer pick another funding source (restart the button flow) |
5. Refunds: `POST /v2/payments/captures/{capture_id}/refund` with `{"amount":{"value":"5.00","currency_code":"USD"}}` for partial, and a `PayPal-Request-Id`.

### Output
Create and capture routes.

### Quality Gate
- Sandbox buyer completes payment; the capture response shows `"status":"COMPLETED"` and a capture id.
- Repeating the capture call with the same `PayPal-Request-Id` does not create a second capture (check the order with `GET /v2/checkout/orders/{id}`).

---

## Phase 3: Verify Webhooks

### Entry Criteria
- A webhook is registered for your app in the developer dashboard; its id is in `PAYPAL_WEBHOOK_ID`. Local testing needs a public tunnel URL; use the dashboard's webhook simulator for test events.

### Actions
1. On receipt, read headers `PAYPAL-AUTH-ALGO`, `PAYPAL-CERT-URL`, `PAYPAL-TRANSMISSION-ID`, `PAYPAL-TRANSMISSION-SIG`, `PAYPAL-TRANSMISSION-TIME`.
2. Call `POST /v1/notifications/verify-webhook-signature` with JSON `{auth_algo, cert_url, transmission_id, transmission_sig, transmission_time, webhook_id, webhook_event}` where `webhook_event` is the parsed event body. Accept only when the response has `"verification_status":"SUCCESS"`.
3. Deduplicate on the event `id` using the event store from `pay-webhook-dedup-ordering`.
4. Handle `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`; re-fetch the capture with `GET /v2/payments/captures/{id}` before changing state.

### Output
`paypal_integration`.

### Quality Gate
- A simulator or sandbox event is accepted with `SUCCESS`, and a request with an altered body is rejected (verification returns `FAILURE`).

---

## Worked Example

Illustrative. Node, order 9001, 1999 USD minor units.

```
POST /v2/checkout/orders  -> 201 {"id":"5O190127TN364715T","status":"CREATED",...}
POST /v2/checkout/orders/5O190127TN364715T/capture  -> 201 {"status":"COMPLETED","purchase_units":[{"payments":{"captures":[{"id":"3C679366HH908993F","status":"COMPLETED"}]}}]}
POST /v1/notifications/verify-webhook-signature -> 200 {"verification_status":"SUCCESS"}
```

---

## Exit Criteria

DONE when sandbox orders are created with correct decimal strings, captured idempotently, and webhooks are accepted only after a `SUCCESS` verification.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `DECIMAL_PRECISION` or amount error | **Adjust**: the formatter used the wrong number of decimals for the currency. |
| Phase 2 | `ORDER_NOT_APPROVED` on capture | **Return**: buyer has not approved; do not retry capture in a loop. |
| Phase 2 | `INSTRUMENT_DECLINED` | **Return**: restart the button flow so the buyer picks another funding source. |
| Phase 3 | Verification `FAILURE` for real events | **Adjust**: pass the event body unchanged and the correct `webhook_id`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
