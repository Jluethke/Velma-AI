# Failed Payment Handler

**One-line description:** Handles invoice.payment_failed, invoice.payment_action_required, invoice.paid and customer.subscription.updated so the app records the failure start, applies the access policy, routes the customer to fix the card or complete 3D Secure on the hosted invoice page, and clears state on recovery.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dunning_settings` (object, required): From `bill-dunning-config`.
- `access_policy` (object[], required): From `bill-dunning-config`.
- `webhook_handler` (string, required): Handler module from the webhook flow.

---

## Outputs

- `failure_handler_code` (string): Paths to the handlers, the `subscription_billing_state` migration, and tests.
- `failure_test_results` (object[]): Scenario, test card used, events observed, stored state after each event, pass or fail.

---

## Phase 1: Store Billing State

### Entry Criteria
- `access_policy` has a row for every status.

### Actions
1. Migration:
   ```sql
   CREATE TABLE subscription_billing_state (
     subscription_id text PRIMARY KEY,
     account_id text NOT NULL,
     status text NOT NULL,
     first_payment_failed_at timestamptz,
     last_failed_invoice_id text,
     action_required_url text,
     last_event_created bigint NOT NULL
   );
   ```
2. Every write checks `event.created >= last_event_created` and skips older events; Stripe does not guarantee order.

### Output
Migration.

### Quality Gate
- `psql -c "\d subscription_billing_state"` shows all columns.

---

## Phase 2: Handlers

### Entry Criteria
- Migration applied.

### Actions
1. `invoice.payment_failed`: if `first_payment_failed_at` is null set it to the invoice's `created` time; store `last_failed_invoice_id` and the invoice's `hosted_invoice_url`. Read `attempt_count` and `next_payment_attempt` (null means no more automatic retries) for the in-app message. Do not send your own email if Stripe's failed-payment emails are on in `dunning_settings`; double emails confuse customers.
2. `invoice.payment_action_required`: the bank requires authentication (SCA). Store `hosted_invoice_url` as `action_required_url` and show an in-app prompt linking to it. Do not retry the charge yourself; the customer must authenticate.
3. `customer.subscription.updated`: store `status`. When status becomes `past_due`, `unpaid` or `canceled`, recompute access from `access_policy`.
4. `invoice.paid`: clear `first_payment_failed_at`, `last_failed_invoice_id`, `action_required_url`.
5. `customer.subscription.deleted`: set status `canceled`.
6. In-app "update card" button: create a customer portal session with `flow_data[type]=payment_method_update` (see `bill-customer-portal`), or link to the hosted invoice page for the open invoice so the customer pays it immediately.
7. Do not mark access revoked on the first `invoice.payment_failed` unless the access policy row says so.

### Output
`failure_handler_code`.

### Quality Gate
- Unit tests feed fixture events in shuffled order and assert the final stored state equals the in-order result.
- Test runner exits 0.

---

## Phase 3: Scenario Tests

### Entry Criteria
- Handlers deployed to test environment.

### Actions
1. Run with test clocks (`bill-test-clock-e2e`) or test cards:

| Scenario | Card | Expected |
|---|---|---|
| Card declines on renewal | 4000 0000 0000 0341 (attaches, then charges fail) | `invoice.payment_failed`, status `past_due`, `first_payment_failed_at` set |
| Authentication needed | 4000 0027 6000 3184 (requires authentication) | `invoice.payment_action_required`, `action_required_url` stored |
| Recovery | update default payment method to `pm_card_visa`, then pay the open invoice (`stripe post /v1/invoices/in_.../pay`) | `invoice.paid`, failure fields cleared, status `active` |
| Retries exhausted | keep failing card, advance clock past the retry window | status equals the post-retry outcome in `dunning_settings` |

2. Confirm each test card's behavior on Stripe's testing page before use and record the URL.

### Output
`failure_test_results`.

### Quality Gate
- Each scenario row lists the observed status from `stripe get /v1/subscriptions/sub_...` and the stored row from `SELECT * FROM subscription_billing_state WHERE subscription_id = ...`, and both match Expected.

---

## Worked Example

Illustrative only.

Renewal with card 0341: event `invoice.payment_failed` with `attempt_count` 1; stored `first_payment_failed_at` = invoice created time; status `past_due`; app shows banner with the hosted invoice link. Customer updates card in portal and pays: `invoice.paid` clears fields; status `active`.

---

## Exit Criteria

DONE when every failure and recovery scenario produces the expected Stripe status and stored state, independent of event order.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Older event overwrote newer status | **Adjust**: enforce the `last_event_created` check on every write. |
| Phase 2 | Customer gets two failure emails | **Adjust**: disable app emails when Stripe's are on, or the reverse, per user choice. |
| Phase 3 | Status after exhaustion differs from settings | **Return**: re-read Dashboard settings in the same mode (test vs live) and update `dunning_settings`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
