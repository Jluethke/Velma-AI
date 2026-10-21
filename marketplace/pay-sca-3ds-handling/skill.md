# SCA and 3D Secure Handling

**One-line description:** Handles the PaymentIntent `requires_action` state for Strong Customer Authentication with `stripe.handleNextAction` or `confirmPayment`, covers the failed-authentication path, and records a pass or fail result for each 3D Secure test card.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `client_confirm_flow` (object, required): Output of `pay-payment-element-client` (or a description of your existing confirm flow).
- `test_env` (object, required): Output of `pay-test-mode-setup`.

---

## Outputs

- `sca_test_results` (object[]): Per test card and per path (complete or fail authentication): final PaymentIntent status, webhook received, and pass or fail against the expected row.

---

## Phase 1: Identify Your Confirmation Model

### Entry Criteria
- A working confirm flow exists.

### Actions
1. Find where confirmation happens: `rg -n "confirmPayment|confirmCardPayment|handleNextAction|handleCardAction|confirm=True|confirm: true|\.Confirm\(" <src>`.
2. Classify:
   | Pattern found | Model | What handles 3D Secure |
   |---|---|---|
   | `stripe.confirmPayment` in the browser | Client-side confirmation | Stripe.js opens the authentication automatically; nothing more to add |
   | Server creates or confirms with `confirm=true` and returns status to browser | Server-side confirmation | Your browser code must call `stripe.handleNextAction({ clientSecret })` when status is `requires_action`, then tell the server to recheck |
   | `handleCardAction` | Older server-side confirmation API | Still works per Stripe.js reference; `handleNextAction` is the current general method; do not change it in this flow unless it fails tests |
3. Write the model into the result header.

### Output
Model classification.

### Quality Gate
- The `rg` output is saved and each hit is mapped to one table row.

---

## Phase 2: Implement the requires_action Branch (Server-Side Model Only)

### Entry Criteria
- Model is server-side confirmation. Skip to Phase 3 for client-side confirmation.

### Actions
1. Server returns `{ status: pi.status, clientSecret: pi.client_secret }` after its confirm call.
2. Browser:
   ```js
   if (res.status === 'requires_action') {
     const { error, paymentIntent } = await stripe.handleNextAction({ clientSecret: res.clientSecret });
     if (error) { showError(error.message); return; }
     await fetch('/payment-status', { method: 'POST', body: JSON.stringify({ id: paymentIntent.id }) });
   }
   ```
3. Server `/payment-status` retrieves the PaymentIntent from Stripe and returns its status; it does not trust a status sent by the browser.
4. After a failed authentication the PaymentIntent returns to `requires_payment_method`. The page must let the buyer pick another method using the same PaymentIntent.

### Output
Branch implemented.

### Quality Gate
- `rg -n "requires_action" <client src>` shows the branch.
- The server status route calls the PaymentIntent retrieve API (show the line).

---

## Phase 3: Run the 3D Secure Test Matrix

### Entry Criteria
- `stripe listen` forwarding to the webhook handler.

### Actions
1. Run each row in the browser. The test authentication page offers buttons to complete or fail the challenge.
   | Card | Action on challenge | Expected final status | Expected webhook |
   |---|---|---|---|
   | 4242 4242 4242 4242 | No challenge appears | `succeeded` | `payment_intent.succeeded` |
   | 4000 0025 0000 3155 | Complete | `succeeded` | `payment_intent.succeeded` |
   | 4000 0025 0000 3155 | Fail | `requires_payment_method` | `payment_intent.payment_failed` |
   | 4000 0000 0000 3220 | Complete | `succeeded` | `payment_intent.succeeded` |
   | 4000 0027 6000 3184 | Complete | `succeeded` | `payment_intent.succeeded` |
2. For each run, read the final status with `stripe payment_intents retrieve pi_...` and find the webhook in the `stripe listen` output.
3. Record each row in `sca_test_results` with pass or fail.
4. If a card's behavior differs from the table, check Stripe's testing docs for that number before calling it a bug.

### Output
`sca_test_results`.

### Quality Gate
- Five rows recorded, each with a `pi_` id, the retrieved status, and the event id from the listen output.
- Zero rows marked pass without a retrieved status.

---

## Worked Example

Illustrative. Client-side model (Payment Element plus `confirmPayment`).

- Phase 1: `rg` hit `src/Checkout.tsx:88: await stripe.confirmPayment({` classified client-side; Phase 2 skipped.
- Phase 3: card 3155 + Fail:
```
$ stripe payment_intents retrieve pi_3QfA...
{ "id": "pi_3QfA...", "status": "requires_payment_method", "last_payment_error": { "code": "payment_intent_authentication_failure", ... } }
```
Listen: `--> payment_intent.payment_failed [evt_3QfB...]` `<-- [200]`. Row marked pass.

---

## Exit Criteria

DONE when every row of the 3D Secure matrix has a recorded status and webhook and all rows pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Mixed models in one codebase | **Adjust**: classify each checkout path separately and test each. |
| Phase 2 | Server trusts browser-reported status | **Stop**: replace with a server-side retrieve. |
| Phase 3 | Challenge modal never appears for 3155 | **Return**: confirm you used test keys and the card number exactly; check for an ad blocker blocking the iframe. |
| Phase 3 | Webhook missing | **Retry**: rerun with `stripe listen` running; then debug the handler. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
