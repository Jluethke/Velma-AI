# Stripe Payment Element Client Confirmation

**One-line description:** Mounts the Stripe Payment Element in the browser with a server-issued client secret, calls `stripe.confirmPayment` with a `return_url`, handles the redirect query parameters, and shows status without fulfilling on the client.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `integration_plan` (object, required): Output of `pay-stripe-integration-choice`; must have `surface` = `elements`.
- `test_env` (object, required): Output of `pay-test-mode-setup`; provides `STRIPE_PUBLISHABLE_KEY`.
- `server_endpoint_path` (string, required): Path of the server route that returns `{clientSecret}`, for example `/create-payment-intent`.
- `return_url` (string, required): Absolute URL of the page Stripe redirects to after confirmation, for example `https://shop.example/complete`.

---

## Outputs

- `client_confirm_flow` (object): Files changed, the confirm call options, how `redirect_status` is handled, and browser test results per test card.

---

## Phase 1: Load Stripe.js and Mount the Element

### Entry Criteria
- `integration_plan.surface` == `elements`.
- The server route returns a client secret (from the stack PaymentIntent flow).

### Actions
1. Load Stripe.js only from Stripe: `npm install @stripe/stripe-js` then `import { loadStripe } from '@stripe/stripe-js'`, or `<script src="https://js.stripe.com/v3/"></script>`. Do not self-host or bundle a copy of Stripe.js.
2. Initialize with the publishable key only: `const stripe = await loadStripe(PUBLISHABLE_KEY)`. A key starting `sk_` in browser code is a leaked secret.
3. Fetch the client secret: `const { clientSecret } = await (await fetch(server_endpoint_path, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ items }) })).json();`
4. Create and mount: `const elements = stripe.elements({ clientSecret }); const paymentElement = elements.create('payment'); paymentElement.mount('#payment-element');`. React apps use `<Elements stripe={stripePromise} options={{ clientSecret }}>` and `<PaymentElement />` from `@stripe/react-stripe-js`.

### Output
Payment Element rendered.

### Quality Gate
- `rg -n "sk_(test|live)_" <client source dirs>` returns no matches.
- The page shows the card form inside an iframe whose `src` is on `js.stripe.com` (check in the Elements panel of developer tools).

---

## Phase 2: Confirm and Handle Errors

### Entry Criteria
- Element mounted.

### Actions
1. On submit, disable the button, then:
   ```js
   const { error } = await stripe.confirmPayment({
     elements,
     confirmParams: { return_url: RETURN_URL },
   });
   ```
   On success, Stripe redirects to `return_url`; code after this line runs only when there is an error.
2. Error handling rule:
   | `error.type` | Show to buyer |
   |---|---|
   | `card_error` or `validation_error` | `error.message` as returned |
   | anything else | A generic "Something went wrong, please try again" |
3. Re-enable the button after an error. Never create a new PaymentIntent on retry; reuse the same client secret.
4. Option `redirect: 'if_required'` keeps card payments on the page; only use it if your page then reads `paymentIntent.status` from the result and handles every status listed in Phase 3.

### Output
Confirm logic.

### Quality Gate
- Test card `4000 0000 0000 0002` shows the decline message on the page and the button re-enables.

---

## Phase 3: Return Page Status Display

### Entry Criteria
- Phase 2 passed.

### Actions
1. On `return_url`, read query parameters `payment_intent`, `payment_intent_client_secret` and `redirect_status` that Stripe appends.
2. Call `stripe.retrievePaymentIntent(clientSecret)` and display by `paymentIntent.status`:
   | Status | Message |
   |---|---|
   | `succeeded` | Payment received |
   | `processing` | Payment processing; we will email you |
   | `requires_payment_method` | Payment failed; try another method (link back to checkout) |
   | other | Something went wrong |
3. Do not mark the order paid or ship anything from this page. Fulfillment is the `payment_intent.succeeded` webhook only.
4. Test with `4242 4242 4242 4242` and `4000 0025 0000 3155` (click "Complete" on the test authentication page). Record each status shown.

### Output
`client_confirm_flow`.

### Quality Gate
- Both test cards reach the return page with the expected status message, recorded with the `pi_` id.
- `rg -n "fulfill|markPaid|ship" <return page file>` returns no fulfillment call.

---

## Worked Example

Illustrative. React app, `server_endpoint_path` = `/api/create-payment-intent`, `return_url` = `http://localhost:3000/complete`.

- Phase 1: iframe `src="https://js.stripe.com/v3/elements-inner-payment-..."` visible.
- Phase 2: card `...0002` shows "Your card was declined."
- Phase 3: card `4242...` returns to `/complete?payment_intent=pi_3Q...&payment_intent_client_secret=pi_3Q..._secret_...&redirect_status=succeeded`, page shows "Payment received".

---

## Exit Criteria

DONE when the Element mounts from a server client secret, errors display correctly, the return page reports status, and no client code fulfills orders.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `IntegrationError` about client secret | **Adjust**: pass the `client_secret` string, not the PaymentIntent id. |
| Phase 1 | Content Security Policy blocks Stripe | **Adjust**: add the Stripe domains listed in Stripe's CSP documentation to `script-src`, `frame-src` and `connect-src`. |
| Phase 2 | Double charge on double click | **Adjust**: disable the button before calling confirm; the server reuse check prevents a second intent. |
| Phase 3 | Return page shows nothing | **Retry**: check that `return_url` is absolute and matches the deployed origin. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
