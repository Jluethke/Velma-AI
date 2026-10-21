# Stripe Test Clock End-to-End Run

**One-line description:** Simulates trial conversion, renewal, failed payment with retries and recovery end to end using Stripe test clocks, advancing frozen time step by step and recording each observed event, invoice and subscription status against the expected values.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `price_catalog` (object[], required): From `bill-stripe-catalog-setup`.
- `trial_policy` (object, required): Trial length and end behavior from `bill-subscription-trial`.
- `dunning_settings` (object, required): From `bill-dunning-config`; gives the retry window and post-retry outcome to expect.

---

## Outputs

- `test_clock_report` (object[]): Per step: frozen time, action, events received by the app's webhook endpoint, subscription `status`, latest invoice `status` and `amount_paid`, expected values, pass or fail.

---

## Phase 1: Set Up the Clock

### Entry Criteria
- Test mode. The app's webhook endpoint (test environment or `stripe listen`) receives events, because test clock advances emit real test-mode events.

### Actions
1. Create the clock at a fixed time: `stripe post /v1/test_helpers/test_clocks -d frozen_time=<unix> -d name="e2e-<date>"`.
2. Create a customer on the clock: `stripe post /v1/customers -d email=e2e@example.com -d test_clock=clock_...`. Only objects created for that customer follow the clock.
3. Attach a card that succeeds: `stripe post /v1/payment_methods/pm_card_visa/attach -d customer=cus_...` and set it default: `-d "invoice_settings[default_payment_method]=pm_..."` on the customer.
4. Create the subscription through the app's own code path (the `trial_code` function), not a hand-written CLI call, so the app logic is tested.

### Output
Clock, customer and subscription IDs.

### Quality Gate
- `stripe get /v1/test_helpers/test_clocks/clock_...` shows `"status": "ready"`.
- The subscription shows `"status": "trialing"` (or `active` with no trial).

---

## Phase 2: Advance Through the Lifecycle

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Advance: `stripe post /v1/test_helpers/test_clocks/clock_.../advance -d frozen_time=<unix>`. Poll the clock until `status` is `ready` before reading anything; while `advancing`, objects are mid-update.
2. Run these steps, reading state after each:

| Step | Advance to | Expected |
|---|---|---|
| 1 | Just past `trial_end` | status `active`, invoice `paid` |
| 2 | Just past the next period end | renewal invoice `paid` |
| 3 | Swap default card to failing card 4000 0000 0000 0341, advance past next period end | invoice `open`, status `past_due`, app shows banner |
| 4 | Advance in steps across the retry window from `dunning_settings` | `invoice.payment_failed` per attempt, `attempt_count` increasing |
| 5a | (Recovery branch) set `pm_card_visa` default and pay the open invoice | `invoice.paid`, status `active` |
| 5b | (Exhaustion branch, new clock) keep failing card past the retry window | status equals the post-retry outcome |

3. Test clocks limit how far one advance can move and how many objects a clock can hold; read the limits in the docs and split advances to fit.
4. Read state with `stripe get /v1/subscriptions/sub_...` and `stripe get /v1/invoices -d subscription=sub_... -d limit=3`, and the app's own tables (`subscription_billing_state`, `account_entitlements`).

### Output
Observed rows for each step.

### Quality Gate
- Every step row has observed Stripe status, observed app state, and expected values filled.

---

## Phase 3: Report and Clean Up

### Entry Criteria
- All steps run.

### Actions
1. Write `test_clock_report`. A step passes only when Stripe state and app state both equal Expected.
2. For any failing step, attach the event IDs received (`stripe events list` filtered by the customer, or the app's `stripe_processed_events` table) so the cause can be traced.
3. Delete the clock to remove its objects: `stripe delete /v1/test_helpers/test_clocks/clock_...`.
4. Do not change Expected values to match observed results; a mismatch is a finding.

### Output
`test_clock_report`.

### Quality Gate
- `test_clock_report` has one row per step with pass or fail; failing rows list event IDs.
- `stripe get /v1/test_helpers/test_clocks/clock_...` returns a not-found error after deletion.

---

## Worked Example

Illustrative only.

Clock frozen at 2026-11-01T00:00Z; 14-day trial from the policy. Step 1 advance to 2026-11-15T01:00Z: status `active`, invoice `paid` 2000. Step 3 with card 0341 advanced past 2026-12-15: invoice `open`, status `past_due`, `subscription_billing_state.first_payment_failed_at` set. Step 5a pay: `invoice.paid`, status `active`, banner cleared. All rows pass.

---

## Exit Criteria

DONE when every lifecycle step has observed Stripe and app state recorded against expected values and the clock is deleted.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Subscription not on the clock | **Adjust**: the customer must be created with `test_clock`; recreate it. |
| Phase 2 | Advance rejected | **Adjust**: split into smaller advances within the documented limit. |
| Phase 2 | App state lags Stripe state | **Retry**: wait for webhook delivery; then check endpoint logs for failures. |
| Phase 3 | Step fails | **Return**: report the step and event IDs to the owning flow (trial, failure handler or gate). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
