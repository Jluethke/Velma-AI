# Adyen Checkout Sessions and HMAC Webhooks

**One-line description:** Integrates Adyen online payments on the test environment with the Checkout API `/sessions` flow, minor-unit amounts and `Idempotency-Key`, and accepts standard webhooks only after HMAC signature validation, answering with `[accepted]`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `currency_exponents` (object, required): Output of `pay-money-minor-units`.

---

## Outputs

- `adyen_integration` (object): Session route, API version used, webhook handler with HMAC validation, modification handling, and test results.

---

## Phase 1: Create a Session

### Entry Criteria
- Adyen test Customer Area access; `ADYEN_API_KEY`, `ADYEN_MERCHANT_ACCOUNT`, `ADYEN_CLIENT_KEY` in `.env`. Allowed origins configured for the client key.

### Actions
1. Read the current Checkout API version from Adyen's API Explorer and record it; the path has the form `https://checkout-test.adyen.com/v<version>/sessions`. Use the official library for `stack` (`Adyen` for Python, `@adyen/api-library` for Node, `github.com/adyen/adyen-go-api-library` for Go) or plain HTTPS.
2. Request:
   ```
   POST https://checkout-test.adyen.com/v<version>/sessions
   X-API-Key: <ADYEN_API_KEY>
   Idempotency-Key: session-create:<order_id>:v1
   {"merchantAccount":"<ADYEN_MERCHANT_ACCOUNT>","amount":{"value":1999,"currency":"USD"},
    "reference":"<order_id>","returnUrl":"https://shop.example/adyen/return","countryCode":"US"}
   ```
   `amount.value` is an integer in minor units, like Stripe, unlike PayPal.
3. Return `id` and `sessionData` to the browser; mount Drop-in or Components with the client key, environment `test`, and the session.
4. The return page may show a result from `resultCode`, but fulfillment waits for the `AUTHORISATION` webhook with `success` = `"true"`.

### Output
Session route.

### Quality Gate
- The session call returns HTTP 201 with `id` and `sessionData`.
- A test payment with an Adyen test card from the Adyen test card page reaches `resultCode` `Authorised` in the browser.

---

## Phase 2: HMAC-Validated Webhook

### Entry Criteria
- A Standard webhook configured in the Customer Area pointing to your public test URL, with an HMAC key generated; key in `ADYEN_HMAC_KEY`.

### Actions
1. Body shape: `{"live":"false","notificationItems":[{"NotificationRequestItem":{...}}]}`. Process each item; Adyen batches items.
2. Validate each item's HMAC with the library helper (Python `Adyen.util.is_valid_hmac_notification`, Node `hmacValidator().validateHMAC(item, key)`, Go library `hmacvalidator` package; check your library version's docs for the exact name). The signature is in `additionalData.hmacSignature`. Manual algorithm per Adyen docs: join `pspReference`, `originalReference`, `merchantAccountCode`, `merchantReference`, `amount.value`, `amount.currency`, `eventCode`, `success` with `:`, HMAC-SHA256 with the hex-decoded key, Base64 the result.
3. Reject (do not process) items that fail validation; log the `pspReference`.
4. Store and deduplicate on `(pspReference, eventCode, success)` via the event store.
5. Respond HTTP 200 with body `[accepted]` after storing, before slow processing. Adyen retries otherwise.

### Output
Webhook handler.

### Quality Gate
- Customer Area "Test configuration" for the webhook shows a successful test delivery.
- A unit test with a sample item signed with a known key passes, and the same item with `amount.value` changed fails validation.

---

## Phase 3: Event Handling and Modifications

### Entry Criteria
- Phase 2 passed.

### Actions
1. Event table:
   | `eventCode` | `success` | Action |
   |---|---|---|
   | `AUTHORISATION` | `"true"` | Mark order paid (or authorized if you capture manually) |
   | `AUTHORISATION` | `"false"` | Mark failed; read `reason` |
   | `CAPTURE` | `"true"` | Mark captured |
   | `REFUND` | `"true"` / `"false"` | Mark refund succeeded or failed |
   | `CHARGEBACK` | any | Open a dispute case |
2. Refund: `POST /v<version>/payments/{pspReference}/refunds` with `{"merchantAccount":..., "amount":{"value":500,"currency":"USD"}, "reference":"refund-<id>"}` and an `Idempotency-Key`. The response status `received` only means accepted; the outcome arrives as a `REFUND` webhook.
3. Note: `success` is a string, not a boolean; compare to `"true"`.

### Output
`adyen_integration`.

### Quality Gate
- After a test payment and a partial refund, the event store holds `AUTHORISATION` and `REFUND` rows with `success` `"true"` and the order state matches.

---

## Worked Example

Illustrative. Python, order 7001.

```
POST /v<version>/sessions -> 201 {"id":"CS1234...","sessionData":"Ab02b4c0!...","amount":{"currency":"USD","value":1999},...}
Webhook item: {"eventCode":"AUTHORISATION","success":"true","pspReference":"NC6HT9CRT65ZGN82","merchantReference":"7001",...}
HMAC valid -> stored -> response body: [accepted]
POST /v<version>/payments/NC6HT9CRT65ZGN82/refunds -> 201 {"status":"received",...}
Webhook item: {"eventCode":"REFUND","success":"true",...}
```

---

## Exit Criteria

DONE when sessions are created with integer minor-unit amounts and idempotency keys, every webhook item is HMAC-validated and deduplicated, and payment and refund outcomes come from webhooks.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | 403 from the API | **Adjust**: the API key lacks the Checkout role or the merchant account is wrong. |
| Phase 1 | Drop-in fails to load | **Adjust**: add your origin to the client key's allowed origins. |
| Phase 2 | All HMAC checks fail | **Adjust**: the key must be hex-decoded before use, and the amount value must be the raw integer. |
| Phase 3 | Refund treated as done on `received` | **Stop**: wait for the `REFUND` webhook. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
