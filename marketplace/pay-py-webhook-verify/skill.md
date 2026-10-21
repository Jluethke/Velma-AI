# Python Stripe Webhook Signature Verification

**One-line description:** Builds a Flask, FastAPI or Django webhook endpoint that reads the exact raw request bytes, verifies the `Stripe-Signature` header with `stripe.Webhook.construct_event`, returns 2xx fast, and is proven with valid, tampered and stale signatures.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root of the Python app.
- `python_framework` (string, required): `flask`, `fastapi` or `django`.
- `webhook_secret_local` (string, required): Confirmation from `pay-stripe-cli-local-webhooks` that `STRIPE_WEBHOOK_SECRET` is set in `.env`.

---

## Outputs

- `webhook_handler` (object): File, route, framework, raw-body method used, the event types dispatched, and the three verification test results.

---

## Phase 1: Read the Raw Body Correctly

### Entry Criteria
- `STRIPE_WEBHOOK_SECRET` starts with `whsec_`.

### Actions
1. Use exactly the raw-body accessor for your framework. Any JSON parsing before verification changes the bytes and the signature fails.
   | Framework | Raw body | Signature header | Extra requirement |
   |---|---|---|---|
   | flask | `request.get_data()` (bytes) | `request.headers.get("Stripe-Signature")` | Do not touch `request.json` or `request.form` before verifying |
   | fastapi | `await request.body()` with `request: Request` parameter | `request.headers.get("stripe-signature")` | Do not declare a Pydantic body model on this route |
   | django | `request.body` | `request.META.get("HTTP_STRIPE_SIGNATURE")` | Decorate view with `@csrf_exempt` and `@require_POST`; this route only |
2. Write the route at the path used in `stripe listen --forward-to`.
3. Check middleware: `rg -n "before_request|middleware|request\.json|get_json" <app files>`. Any global hook that parses or logs the body must skip this route.

### Output
Route skeleton reading raw bytes.

### Quality Gate
- The route file contains the accessor from the table for `python_framework`, and `rg -n "request\.json|get_json|BaseModel" <route function>` shows nothing inside the webhook function.

---

## Phase 2: Verify and Dispatch

### Entry Criteria
- Phase 1 passed.

### Actions
1. Verify:
   ```python
   try:
       event = stripe.Webhook.construct_event(payload, sig_header, os.environ["STRIPE_WEBHOOK_SECRET"])
   except ValueError:
       return 400  # body is not valid JSON
   except stripe.error.SignatureVerificationError:
       return 400  # wrong secret, modified body, or timestamp outside tolerance
   ```
   Newer SDKs also export `stripe.SignatureVerificationError`; use the name your installed version documents. The default timestamp tolerance is 300 seconds (the `tolerance` parameter); do not raise it to make failures go away.
2. Dispatch by `event["type"]` to small functions; unknown types return 200 and are logged at debug level.
3. Return 2xx within a few seconds. Heavy work (email, fulfillment that calls other services) goes to a job queue, carrying `event["id"]`.
4. Never log the full payload at info level in production; log `event["id"]`, `event["type"]` and the object id.

### Output
Verified handler.

### Quality Gate
- `stripe trigger payment_intent.succeeded` produces `<-- [200]` in `stripe listen` output.

---

## Phase 3: Prove Rejection

### Entry Criteria
- Phase 2 passed.

### Actions
1. Tampered body test: `curl -s -o /dev/null -w "%{http_code}" -X POST localhost:<port><path> -H "Stripe-Signature: t=1,v1=deadbeef" -H "Content-Type: application/json" -d '{"id":"evt_fake","type":"payment_intent.succeeded"}'`. Expected `400`.
2. Unit test with a generated signature: compute `v1 = HMAC-SHA256(secret, f"{t}.{payload}")` as hex, send header `t=<t>,v1=<hex>`. Assert 200 for current `t`, 400 for `t` older than 300 seconds, 400 when one byte of the payload changes after signing.
3. Run `pytest -q tests/test_webhook.py`.

### Output
`webhook_handler`.

### Quality Gate
- The curl command prints `400`.
- pytest summary shows the three signature tests passed.

---

## Worked Example

Illustrative. FastAPI, path `/webhook`.

```python
@app.post("/webhook")
async def webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig, os.environ["STRIPE_WEBHOOK_SECRET"])
    except (ValueError, stripe.error.SignatureVerificationError):
        return Response(status_code=400)
    await queue.enqueue(event["id"], event["type"])
    return Response(status_code=200)
```
- Phase 2: listen shows `<-- [200] POST http://localhost:8000/webhook [evt_3Q...]`.
- Phase 3: curl prints `400`; `pytest -q` prints `3 passed`.

---

## Exit Criteria

DONE when the handler verifies signatures over the raw bytes, returns 2xx quickly for valid events, and rejects tampered and stale signatures in tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Framework not in the table | **Return**: find that framework's raw-body accessor in its docs; do not reserialize parsed JSON. |
| Phase 2 | Every event fails verification | **Adjust**: compare secret source (CLI vs Dashboard endpoint), then check for middleware that reads the body. |
| Phase 2 | Handler times out | **Adjust**: move work to a queue and return 200 first. |
| Phase 3 | Tampered request returns 200 | **Stop**: verification is bypassed; fix before any deploy. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
