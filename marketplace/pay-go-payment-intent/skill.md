# Go Stripe PaymentIntent Handler

**One-line description:** Builds a Go `net/http` handler that prices the cart server side as `int64` minor units, creates a Stripe PaymentIntent through stripe-go with a stored idempotency key, returns only the `client_secret`, and is covered by a `go test` integration test in test mode.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Go module root (contains `go.mod`).
- `test_env` (object, required): Output of `pay-test-mode-setup`.
- `currency_exponents` (object, required): Output of `pay-money-minor-units`.
- `idempotency_audit` (object[], required): Output of `pay-idempotency-keys`.

---

## Outputs

- `payment_intent_endpoint` (object): Route path, file, request and response JSON shape, and the passing `go test` command with its output.

---

## Phase 1: Pin the SDK and Price Server Side

### Entry Criteria
- `go list -m all | grep stripe-go` prints a module path such as `github.com/stripe/stripe-go/v<N>`.

### Actions
1. Note the major version `<N>` from that output. Every import in the app uses the same `v<N>` path, for example `github.com/stripe/stripe-go/v<N>` and `github.com/stripe/stripe-go/v<N>/paymentintent`. Mixed major versions compile as different packages and break type checks.
2. Read the stripe-go README for your `<N>`: recent majors document a client object (`stripe.NewClient`) as well as the package-level resource functions. Pick one style and use it everywhere.
3. Decode the request into `struct { Items []struct{ ID string; Qty int64 } }`. Never accept an amount from the client.
4. Compute `amount int64` from database prices. Check `amount > 0`.
5. Persist the order with `PICreateKey = fmt.Sprintf("pi-create:%d:v1", order.ID)` before calling Stripe.

### Output
Order with stored key.

### Quality Gate
- `go vet ./...` exits 0.
- A table-driven unit test checks the amount for at least two carts.

---

## Phase 2: Create the PaymentIntent

### Entry Criteria
- Phase 1 passed.

### Actions
1. Package-level style example (match names to your `<N>` README):
   ```go
   stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
   params := &stripe.PaymentIntentParams{
       Amount:   stripe.Int64(order.Amount),
       Currency: stripe.String(strings.ToLower(order.Currency)),
       AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
           Enabled: stripe.Bool(true),
       },
   }
   params.AddMetadata("order_id", strconv.FormatInt(order.ID, 10))
   params.SetIdempotencyKey(order.PICreateKey)
   pi, err := paymentintent.New(params)
   ```
2. If `order.PaymentIntentID != ""`, call `paymentintent.Get(order.PaymentIntentID, nil)` and return its client secret instead of creating.
3. On error, use `var serr *stripe.Error; if errors.As(err, &serr) { log.Printf("stripe %s %s req=%s", serr.Type, serr.Code, serr.RequestID) }`; respond 502.
4. Respond with `json.NewEncoder(w).Encode(map[string]string{"clientSecret": pi.ClientSecret})`, `Content-Type: application/json`.
5. Register with `mux.HandleFunc("POST /create-payment-intent", h)` (Go 1.22+ method patterns) or check `r.Method` on older Go.
6. Do not fulfill here; fulfillment happens in the verified webhook.

### Output
Working handler.

### Quality Gate
- `curl -s -X POST localhost:<port>/create-payment-intent -d '{"items":[{"ID":"sku_1","Qty":1}]}'` returns a `clientSecret` containing `_secret_`.
- `go build ./...` exits 0.

---

## Phase 3: Integration Test

### Entry Criteria
- Handler returns a client secret.

### Actions
1. Write `payment_intent_integration_test.go` with a build tag or `t.Skip` when `STRIPE_SECRET_KEY` is unset or does not start with `sk_test_`.
2. Use `httptest.NewServer` with your handler; post the same order twice; assert one stored PaymentIntent id.
3. Confirm with `paymentintent.Confirm(id, &stripe.PaymentIntentConfirmParams{PaymentMethod: stripe.String("pm_card_visa"), ReturnURL: stripe.String("https://example.com/return")})`; assert `pi.Status == stripe.PaymentIntentStatusSucceeded`.
4. Run `go test -run TestPaymentIntent -v ./...`.

### Output
`payment_intent_endpoint`.

### Quality Gate
- `go test` output shows `--- PASS: TestPaymentIntent` and `ok` for the package; a `SKIP` does not count as a pass.

---

## Worked Example

Illustrative. One item at 1500 USD minor units.

- Phase 1: module `github.com/stripe/stripe-go/v<N>` recorded; order 7 key `pi-create:7:v1`.
- Phase 2: `curl` prints `{"clientSecret":"pi_3Qx..._secret_Lm..."}`.
- Phase 3:
```
=== RUN   TestPaymentIntent
--- PASS: TestPaymentIntent (2.11s)
ok   example.com/shop/payments  2.130s
```

---

## Exit Criteria

DONE when the handler returns only a client secret for a server-priced, idempotent PaymentIntent and `go test` passes (not skips) in test mode.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Two stripe-go majors in `go.mod` | **Adjust**: rewrite imports to one major, run `go mod tidy`. |
| Phase 2 | Compile error on a params field | **Adjust**: field names differ by major; read the type in `go doc github.com/stripe/stripe-go/v<N>.PaymentIntentParams`. |
| Phase 2 | `idempotency_error` | **Adjust**: apply the version-bump rule from `pay-idempotency-keys`. |
| Phase 3 | Test skipped | **Return**: set a test key and rerun; a skip is not evidence. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
