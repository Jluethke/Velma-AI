# Payments Integration Surface Choice

**One-line description:** Picks the payment provider surface (Stripe Checkout, Stripe Payment Element, Payment Links, PayPal Orders, Adyen Sessions) from written product requirements using a fixed decision table, and records which intent objects, webhooks and PCI self-assessment type the choice implies.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `product_requirements` (string, required): Plain text or a file path describing what is sold: one-time or recurring, whether cards are saved for later, countries, currencies, whether the payment form must be fully custom-styled inside the app, and mobile or web.
- `provider` (string, required): One of `stripe`, `paypal`, `adyen`. The contract the business already holds. This flow never chooses a provider for the user.
- `stack` (string, required): Server language, one of `python`, `node`, `go`.

---

## Outputs

- `integration_plan` (object): Fields `provider`, `surface` (`checkout`, `elements`, `payment_links`, `paypal_orders_v2`, `adyen_sessions`), `intent_objects` (list, for example `PaymentIntent`, `SetupIntent`, `Checkout Session`), `saves_cards` (bool), `required_webhook_events` (list), `expected_saq` (string, to be confirmed by `pay-pci-scope-saq`), `stack`, and `open_questions` (list).

---

## Phase 1: Extract Requirement Facts

### Entry Criteria
- `product_requirements` is readable and non-empty.
- `provider` is one of the three allowed values.

### Actions
1. Read `product_requirements` once, top to bottom. Do not guess missing facts.
2. Fill this fact sheet with `yes`, `no` or `unknown` for each row:
   | Fact | Question |
   |---|---|
   | F1 one_time | Does the buyer pay a single amount per order? |
   | F2 recurring | Are there subscriptions or repeat charges? |
   | F3 saves_cards | Is a card stored to charge later without the buyer present? |
   | F4 custom_ui | Must the card form sit inside the app's own page with custom styling? |
   | F5 no_code | Is there no backend developer available at all? |
   | F6 multi_currency | Are prices shown in more than one currency? |
   | F7 native_mobile | Is the buyer in a native iOS or Android app? |
3. For every `unknown`, add a line to `open_questions` with the exact question to ask the business owner.

### Output
A seven-row fact sheet plus `open_questions`.

### Quality Gate
- All seven facts have a value of `yes`, `no` or `unknown`.
- Every `unknown` has a matching entry in `open_questions`.

---

## Phase 2: Apply the Decision Table

### Entry Criteria
- Fact sheet complete.

### Actions
1. If `provider` is `paypal`, set `surface` = `paypal_orders_v2` and skip to step 5.
2. If `provider` is `adyen`, set `surface` = `adyen_sessions` and skip to step 5.
3. If `provider` is `stripe`, walk these rows top to bottom and stop at the first match:
   | Row | Condition | `surface` | Why |
   |---|---|---|---|
   | S1 | F5 = yes | `payment_links` | No server code; Stripe hosts the page and the product catalog. |
   | S2 | F4 = no | `checkout` | Stripe-hosted page; least code; Stripe renders payment methods, 3D Secure and receipts. |
   | S3 | F4 = yes | `elements` | Payment Element in an iframe on your page; you create the PaymentIntent server side and confirm with Stripe.js. |
   | S4 | F4 = unknown | `checkout` | Default to the smaller PCI and code surface; record the question. |
4. For F7 = yes, add to `open_questions`: "Native mobile uses the Stripe iOS or Android SDK Payment Sheet, which this chain does not cover."
5. Set `intent_objects`:
   | Surface | F3 saves_cards = no | F3 saves_cards = yes |
   |---|---|---|
   | `checkout` | Checkout Session `mode=payment` | Checkout Session `mode=setup` or `mode=payment` with `payment_intent_data.setup_future_usage` |
   | `elements` | PaymentIntent | PaymentIntent with `setup_future_usage`, or SetupIntent when no charge happens now |
   | `payment_links` | Payment Link | Not supported in this chain; record as open question |
   | `paypal_orders_v2` | Order (intent `CAPTURE`) | Vaulting; record as open question |
   | `adyen_sessions` | Session | Session with `storePaymentMethod`; record as open question |
6. If F2 = yes, add to `open_questions`: "Subscriptions need Stripe Billing or the provider's recurring product; this chain covers the payment and webhook layer only."

### Output
`surface` and `intent_objects` set.

### Quality Gate
- `surface` equals exactly one value from the table.
- The matched row (S1 to S4, or the provider shortcut) is written next to the choice.

---

## Phase 3: Record Webhooks and Expected SAQ

### Entry Criteria
- `surface` set.

### Actions
1. Set `required_webhook_events` from this table:
   | Surface | Events |
   |---|---|
   | `checkout` | `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created` |
   | `elements` | `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.processing`, `charge.refunded`, `charge.dispute.created` (add `setup_intent.succeeded` when saving cards) |
   | `payment_links` | same as `checkout` |
   | `paypal_orders_v2` | `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED` |
   | `adyen_sessions` | `AUTHORISATION`, `CAPTURE`, `REFUND`, `CHARGEBACK` (event codes as Adyen spells them) |
2. Set `expected_saq`: `SAQ A` for every surface in this table, provided raw card data never reaches your servers and every card field is served by the provider. Mark it "expected, confirm in pay-pci-scope-saq".
3. Write `integration_plan` as JSON.

### Output
`integration_plan`.

### Quality Gate
- `python -c "import json,sys; json.load(open(sys.argv[1]))" integration_plan.json` exits 0.
- `required_webhook_events` is non-empty and matches the table row for `surface`.

---

## Worked Example

Illustrative. Input: `provider` = `stripe`, `stack` = `node`, requirements: "Online course shop, one-time purchases in USD and EUR, checkout must match our React design, no saved cards."

- Phase 1: F1 yes, F2 no, F3 no, F4 yes, F5 no, F6 yes, F7 no. No open questions.
- Phase 2: Row S3 matches, `surface` = `elements`, `intent_objects` = `["PaymentIntent"]`.
- Phase 3:
```json
{"provider":"stripe","surface":"elements","intent_objects":["PaymentIntent"],"saves_cards":false,
 "required_webhook_events":["payment_intent.succeeded","payment_intent.payment_failed","payment_intent.processing","charge.refunded","charge.dispute.created"],
 "expected_saq":"SAQ A (expected, confirm in pay-pci-scope-saq)","stack":"node","open_questions":[]}
```

---

## Exit Criteria

DONE when `integration_plan` is valid JSON with one `surface`, its `intent_objects`, `required_webhook_events` and every unresolved fact listed in `open_questions`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `product_requirements` empty | **Stop**: ask for the requirements; do not choose a surface from nothing. |
| Phase 1 | `provider` not one of the three values | **Stop**: this chain covers Stripe, PayPal and Adyen only. |
| Phase 2 | Two rows seem to match | **Adjust**: take the first matching row in table order; the order is the rule. |
| Phase 3 | Surface needs saved cards on PayPal or Adyen | **Return**: record in `open_questions` and continue with one-time payments. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
