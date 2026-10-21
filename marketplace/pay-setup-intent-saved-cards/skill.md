# Stripe SetupIntent and Off-Session Charges

**One-line description:** Saves a card to a Stripe Customer with a SetupIntent (`usage=off_session`), later charges it with `off_session=true, confirm=true`, and handles the `authentication_required` decline by bringing the customer back on-session.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `test_env` (object, required): Output of `pay-test-mode-setup`.
- `idempotency_audit` (object[], required): Output of `pay-idempotency-keys`.

---

## Outputs

- `setup_intent_flow` (object): Server route that creates the SetupIntent, client confirm call, the webhook that stores the PaymentMethod, and test results.
- `off_session_charge_procedure` (object): The charge function, its idempotency key recipe, the error-to-action table and test results with cards `3155` and `3184`.

---

## Phase 1: Customer and SetupIntent

### Entry Criteria
- The app has a logged-in user to attach a Stripe Customer to.
- The buyer has agreed to terms that allow later charges; store the time and text version of that agreement.

### Actions
1. Create one Stripe Customer per app user and store `cus_...` on the user row. Key: `customer-create:<user_id>:v1`.
2. Create the SetupIntent server side:
   - Python: `stripe.SetupIntent.create(customer=cus_id, automatic_payment_methods={"enabled": True}, usage="off_session", idempotency_key=f"si-create:{user.id}:{attempt}")`
   - Node: `stripe.setupIntents.create({ customer, automatic_payment_methods: { enabled: true }, usage: 'off_session' }, { idempotencyKey })`
   - Go: `setupintent.New(&stripe.SetupIntentParams{Customer: stripe.String(cus), Usage: stripe.String("off_session"), AutomaticPaymentMethods: &stripe.SetupIntentAutomaticPaymentMethodsParams{Enabled: stripe.Bool(true)}})`
3. Return only `client_secret` (`seti_..._secret_...`).
4. Client: mount the Payment Element with that secret and call `stripe.confirmSetup({ elements, confirmParams: { return_url } })`.
5. Webhook `setup_intent.succeeded`: read `setup_intent.payment_method` (`pm_...`) and store it as the user's default. Do not store anything else about the card beyond what Stripe returns on the PaymentMethod (brand, last4, exp) for display.

### Output
`setup_intent_flow`.

### Quality Gate
- After a test setup with `4242 4242 4242 4242`, `stripe payment_methods list --customer cus_... --type card` (or the SDK equivalent) lists one PaymentMethod.
- The user row has the `pm_` id, written by the webhook handler (check the handler log line).

---

## Phase 2: Charge Off-Session

### Entry Criteria
- A user with a stored `pm_` id.

### Actions
1. Charge with:
   - Python: `stripe.PaymentIntent.create(amount=a, currency=c, customer=cus, payment_method=pm, off_session=True, confirm=True, idempotency_key=f"offsession:{invoice.id}:v1")`
   - Node: `stripe.paymentIntents.create({ amount, currency, customer, payment_method, off_session: true, confirm: true }, { idempotencyKey })`
   - Go: `PaymentIntentParams{..., OffSession: stripe.Bool(true), Confirm: stripe.Bool(true)}`
2. Map errors (read `error.code` and `error.payment_intent` from the SDK exception):
   | `code` | Action |
   |---|---|
   | `authentication_required` | Mark invoice `needs_customer_action`; email a link to a page that confirms the existing PaymentIntent on-session with `stripe.confirmCardPayment(client_secret, { payment_method: pm })` or the Payment Element |
   | `card_declined` | Mark `failed`; read `decline_code`; ask the customer for a new card |
   | `expired_card` | Ask for a new card |
   | network or 5xx error | Retry with the same idempotency key |
3. Do not retry an `authentication_required` decline off-session in a loop; only the customer can complete authentication.

### Output
Charge function and error table.

### Quality Gate
- Unit test maps each `code` above to the right invoice state.

---

## Phase 3: Test With the Authentication Cards

### Entry Criteria
- Phases 1 and 2 done; `stripe listen` forwarding.

### Actions
1. Set up with `4000 0025 0000 3155`, completing the test authentication. Then charge off-session. Expected: `succeeded` (the setup authenticated it for off-session use).
2. Set up with `4000 0027 6000 3184`. Charge off-session. Expected: error `authentication_required`, PaymentIntent status `requires_payment_method`, invoice `needs_customer_action`.
3. Open the emailed link, authenticate, and confirm. Expected: `payment_intent.succeeded` webhook `[200]`.
4. Record all three outcomes.

### Output
`off_session_charge_procedure`.

### Quality Gate
- Three recorded outcomes match the expected column, each with a `pi_` id.

---

## Worked Example

Illustrative. Node app, monthly invoice 1200 USD minor units.

- Phase 1: `seti_1Q..._secret_...` returned; webhook stores `pm_1Qabc` for user 55.
- Phase 2: charge with key `offsession:inv_2026_10_55:v1`.
- Phase 3: card `3155` gives `succeeded`; card `3184` throws `StripeCardError` with `code: 'authentication_required'`, invoice set to `needs_customer_action`; after on-session completion, listen shows `<-- [200] POST ... payment_intent.succeeded`.

---

## Exit Criteria

DONE when cards are saved through SetupIntents, off-session charges are idempotent, and both authentication test cards produce the expected states.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No recorded customer agreement for later charges | **Stop**: add the consent step first. |
| Phase 1 | PaymentMethod not attached to customer | **Adjust**: pass `customer` when creating the SetupIntent. |
| Phase 2 | Charges retried in a loop on `authentication_required` | **Stop**: remove the loop; route to the on-session page. |
| Phase 3 | `3155` fails off-session | **Retry**: confirm the setup completed with authentication; then rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
