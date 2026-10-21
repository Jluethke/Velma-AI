# Stripe Subscription Trials

**One-line description:** Creates Stripe subscriptions with free trials (with or without a card up front), sets trial_settings.end_behavior.missing_payment_method explicitly, collects the payment method with a SetupIntent, and handles the trial lifecycle events.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `price_catalog` (object[], required): From `bill-stripe-catalog-setup`.
- `trial_policy` (object, required): Trial length in days (user input or `trial_days` from the spec), whether a card is required at signup, and what happens at trial end without a card: "cancel", "pause" or "create_invoice".
- `webhook_handler` (string, required): Handler module from `bill-py-webhook-endpoint` or `bill-node-webhook-endpoint`.

---

## Outputs

- `trial_code` (string): Paths to the subscription-create function and the trial event handlers.
- `trial_test_results` (object[]): For each scenario: steps run, observed subscription `status`, observed events, pass or fail.

---

## Phase 1: Create the Trial Subscription

### Entry Criteria
- `trial_policy` has all three fields. The trial length is from the user or the spec; do not pick a number.

### Actions
1. Resolve the price by lookup key, never by hard-coded ID: Python `stripe.Price.list(lookup_keys=["pro_monthly_usd"])`; Node `stripe.prices.list({ lookup_keys: ['pro_monthly_usd'] })`.
2. Create the subscription (Python shown; Node uses `stripe.subscriptions.create` with the same fields):
   ```python
   sub = stripe.Subscription.create(
       customer=customer_id,
       items=[{"price": price_id}],
       trial_period_days=trial_days,
       payment_behavior="default_incomplete",
       payment_settings={"save_default_payment_method": "on_subscription"},
       trial_settings={"end_behavior": {"missing_payment_method": end_behavior}},
       expand=["pending_setup_intent"],
   )
   ```
   Use `trial_end=<unix>` instead of `trial_period_days` only when the trial must end at a fixed time.
3. With a trial there is no payment now, so Stripe creates a `pending_setup_intent`. Send its `client_secret` to the frontend and confirm it with Stripe.js `stripe.confirmSetup` (Payment Element) to save the card. If `pending_setup_intent` is null, no card is required now.
4. Card-required policy: block access until the SetupIntent succeeds (`setup_intent.succeeded` event or SetupIntent status `succeeded`). Card-optional policy: grant access while `status == "trialing"`.
5. Add an idempotency key to the create call (`idempotency_key=` in Python, `{ idempotencyKey }` options argument in Node) built from your signup ID, so a double-click does not create two subscriptions.

### Output
Subscription create function.

### Quality Gate
- In test mode the created subscription shows `"status": "trialing"` and `trial_end` equal to creation time plus the trial length.
- Calling the create function twice with the same signup ID returns the same subscription ID.

---

## Phase 2: Handle Trial Events

### Entry Criteria
- Phase 1 gate passed; webhook endpoint exists.

### Actions
1. Add handlers to `webhook_handler`:

| Event | Action |
|---|---|
| `customer.subscription.trial_will_end` | Email the customer to add a card if `default_payment_method` is null. Stripe sends this a fixed time before trial end; read the timing in the docs, do not assume it. |
| `customer.subscription.updated` with status `active` | Trial converted; record conversion. |
| `customer.subscription.paused` | End behavior was `pause`; remove paid access; offer resume after card entry. |
| `customer.subscription.deleted` | End behavior was `cancel`; remove access. |
| `invoice.payment_failed` on the first post-trial invoice | Hand off to `bill-payment-failure-handler`. |

2. Resume a paused subscription after the customer adds a card: `stripe.Subscription.resume(sub_id, billing_cycle_anchor="now")` (check the resume endpoint options in the API reference for your version).
3. Do not extend a trial by editing the database; use `stripe.Subscription.modify(sub_id, trial_end=<new unix>, proration_behavior="none")` so Stripe and the app agree.

### Output
`trial_code`.

### Quality Gate
- `stripe trigger customer.subscription.trial_will_end` is handled with a 200 and the expected email job is enqueued (check the jobs table or queue).
- Unit tests for each handler pass (`pytest -q` or the Node test runner exits 0).

---

## Phase 3: Prove End Behavior

### Entry Criteria
- Handlers deployed to the test environment.

### Actions
1. Run each end behavior with a test clock (see `bill-test-clock-e2e`): create the customer on a clock, subscribe with no card, advance past `trial_end`.
2. Expected results: `cancel` gives `status` `canceled`; `pause` gives `status` `paused`; `create_invoice` gives an open invoice and `status` `past_due` or `incomplete` per the docs for your version.
3. Run once with a card (`pm_card_visa`) attached: advance past trial end; expect `status` `active` and a paid invoice.
4. Record every scenario in `trial_test_results`.

### Output
`trial_test_results`.

### Quality Gate
- Each scenario row lists the status read with `stripe get /v1/subscriptions/sub_...` after the advance, and it matches the expected value.

---

## Worked Example

Illustrative only.

Policy: 14 days (from the spec), card optional, end behavior `pause`. Phase 1: create returns `status` "trialing", `pending_setup_intent` "seti_1Q...". Phase 2: trigger returns 200 and one `trial_reminder` job. Phase 3: test clock advanced 15 days; `stripe get /v1/subscriptions/sub_1Q...` shows `"status": "paused"`.

---

## Exit Criteria

DONE when trial subscriptions are created idempotently with an explicit end behavior and each end behavior plus card conversion is proven with observed statuses.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `trial_policy` missing end behavior | **Stop**: ask the user; Stripe's default would decide revenue policy silently. |
| Phase 1 | Two subscriptions for one signup | **Adjust**: add the idempotency key and a unique signup constraint. |
| Phase 2 | Paused subscription not resumable | **Adjust**: confirm a default payment method is set before calling resume. |
| Phase 3 | Observed status differs from expected | **Return**: report both values; check the end behavior actually stored on the subscription. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
