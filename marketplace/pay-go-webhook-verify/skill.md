# Go Stripe Webhook Signature Verification

**One-line description:** Builds a Go `net/http` webhook handler that bounds and reads the raw body with `http.MaxBytesReader` and `io.ReadAll`, verifies it with stripe-go `webhook.ConstructEvent`, handles the API version mismatch error, and is proven with `httptest`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Go module root.
- `webhook_secret_local` (string, required): Confirmation from `pay-stripe-cli-local-webhooks` that `STRIPE_WEBHOOK_SECRET` is set.

---

## Outputs

- `webhook_handler` (object): File, route, the ConstructEvent variant used, dispatched event types, and `go test` results.

---

## Phase 1: Read the Raw Body

### Entry Criteria
- `STRIPE_WEBHOOK_SECRET` starts with `whsec_`. stripe-go major version `<N>` recorded.

### Actions
1. In the handler:
   ```go
   const maxBodyBytes = int64(65536)
   r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
   payload, err := io.ReadAll(r.Body)
   if err != nil { http.Error(w, "read error", http.StatusServiceUnavailable); return }
   ```
   65536 is the limit used in Stripe's Go webhook example; if your events are larger (large `metadata` or expanded objects), raise it and record why.
2. Do not wrap the handler in middleware that decodes JSON or replaces `r.Body` before this point: `rg -n "json.NewDecoder\(r.Body\)|r.Body =" <middleware files>`.

### Output
Raw bytes in `payload`.

### Quality Gate
- `rg -n "MaxBytesReader" <handler file>` shows the line.
- `go vet ./...` exits 0.

---

## Phase 2: Verify and Dispatch

### Entry Criteria
- Phase 1 passed.

### Actions
1. Verify with package `github.com/stripe/stripe-go/v<N>/webhook`:
   ```go
   event, err := webhook.ConstructEvent(payload, r.Header.Get("Stripe-Signature"), os.Getenv("STRIPE_WEBHOOK_SECRET"))
   if err != nil { w.WriteHeader(http.StatusBadRequest); return }
   ```
2. Known pitfall: `ConstructEvent` also returns an error when the event's `api_version` differs from the version the library was built for. If verification fails only with a message about API version mismatch, choose one fix: (a) set the webhook endpoint's API version to match the library, or (b) use `webhook.ConstructEventWithOptions(payload, sig, secret, webhook.ConstructEventOptions{IgnoreAPIVersionMismatch: true})` and handle unmarshal differences yourself. Record which one.
3. Dispatch on `event.Type` (for example `"payment_intent.succeeded"`); unmarshal `event.Data.Raw` into `stripe.PaymentIntent` with `json.Unmarshal`.
4. Write 200 quickly; enqueue slow work with `event.ID`.

### Output
Verified handler.

### Quality Gate
- `stripe trigger payment_intent.succeeded` produces `<-- [200]` in `stripe listen`.

---

## Phase 3: Prove Rejection With httptest

### Entry Criteria
- Phase 2 passed.

### Actions
1. In `webhook_test.go`, build a valid signature with `webhook.GenerateTestSignedPayload(&webhook.UnsignedPayload{Payload: body, Secret: secret})` if your `<N>` provides it (check `go doc github.com/stripe/stripe-go/v<N>/webhook`); otherwise compute `hex(HMAC-SHA256(secret, t + "." + body))` and header `t=<t>,v1=<hex>`.
2. Cases: valid signature returns 200; body changed after signing returns 400; header `t=1,v1=bad` returns 400.
3. Use `httptest.NewRecorder()` and call the handler directly.
4. Run `go test -run TestWebhook -v ./...`.

### Output
`webhook_handler`.

### Quality Gate
- `go test` prints `--- PASS` for all three cases and `ok` for the package.

---

## Worked Example

Illustrative.

- Phase 2: first run fails with an API version mismatch message because the CLI forwards events at the account's default version. Fix (a) chosen: pin the endpoint version. Listen then shows `<-- [200] POST http://localhost:4242/webhook [evt_3Q...]`.
- Phase 3:
```
=== RUN   TestWebhook/valid
=== RUN   TestWebhook/tampered
=== RUN   TestWebhook/bad_header
--- PASS: TestWebhook (0.00s)
ok   example.com/shop/webhooks  0.012s
```

---

## Exit Criteria

DONE when the Go handler verifies signatures over a bounded raw body, the version mismatch decision is recorded, and three httptest cases pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `http: request body too large` | **Adjust**: raise the limit and record the observed event size. |
| Phase 2 | Version mismatch error | **Adjust**: apply fix (a) or (b) from Phase 2 step 2; never skip verification. |
| Phase 2 | All events 400 with a signature message | **Adjust**: check CLI vs Dashboard secret. |
| Phase 3 | Tampered case returns 200 | **Stop**: verification is not in the request path; fix first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
