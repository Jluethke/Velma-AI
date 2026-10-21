# Stripe Dunning Configuration

**One-line description:** Configures Stripe Smart Retries or a custom retry schedule, failed-payment and card-expiry customer emails, and the subscription outcome after the last retry, then derives an access policy table that says what the app allows in each subscription status including a user-defined grace period.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `invoice_settings` (object, required): From `bill-invoice-lifecycle`.
- `grace_period_days` (integer, required): Days of continued access after the first failed payment, set by the user. Zero is allowed. This flow does not choose a number.

---

## Outputs

- `dunning_settings` (object): Retry mode and schedule as read from the Dashboard, emails enabled, post-retry outcome for subscriptions and invoices, and the date read.
- `access_policy` (object[]): One row per subscription status: access level ("full", "read_only", "none"), banner text key, and the rule's source.

---

## Phase 1: Retry and Email Settings

### Entry Criteria
- Account owner or admin access to the Dashboard (test mode first).

### Actions
1. Open Dashboard > Settings > Billing > Revenue recovery (the menu label may differ; search "retries" in Dashboard settings). Choose:

| Situation | Setting |
|---|---|
| No reason to deviate | Smart Retries with Stripe's recommended policy; record the number of retries and the window shown |
| Contract or regulation fixes retry days | Custom schedule with the user's days |

2. Set the subscription outcome after all retries fail. Choose with the user:

| Outcome | Subscription status after last retry | Use when |
|---|---|---|
| Cancel the subscription | `canceled` | self-serve plans; customer resubscribes |
| Mark the subscription unpaid | `unpaid` (invoices stay open) | you want to keep the subscription and collect later |
| Leave the subscription past due | `past_due` | manual collection by your team |

3. Set the invoice outcome after all retries (leave open or mark uncollectible) to match the user's accounting practice.
4. Enable customer emails under Settings > Billing (failed payment emails, expiring card reminders, and the hosted page link for updating the payment method). Record each toggle.
5. Card-network account updater and 3D Secure reminders are configured on the same pages; record what is on.
6. Record everything in `dunning_settings` with the date read. These settings live in the Dashboard; the code must not assume values.

### Output
`dunning_settings`.

### Quality Gate
- `dunning_settings` contains retry mode, retry count and window as displayed, post-retry subscription outcome, invoice outcome, and each email toggle, each with the date read.

---

## Phase 2: Access Policy Table

### Entry Criteria
- `dunning_settings` and `grace_period_days` present.

### Actions
1. Build the table; fill the access column with the user, using these starting rows:

| Subscription status | Access | Note |
|---|---|---|
| `trialing` | full | |
| `active` | full | |
| `past_due`, days since first failure less than `grace_period_days` | full plus warning banner | days counted from the first failed invoice's `created` |
| `past_due`, grace elapsed | user choice: read_only or none | |
| `unpaid` | user choice: read_only or none | |
| `incomplete` | none | first payment never succeeded |
| `incomplete_expired` | none | |
| `paused` | none or read_only (user choice) | |
| `canceled` | none | data retention per the user's policy |

2. Store the table as data (a JSON file or a database table), not as scattered `if` statements; `bill-py-feature-gate` and `bill-node-feature-gate` read it.
3. Store `first_payment_failed_at` per subscription in the app database, set on the first `invoice.payment_failed` and cleared on `invoice.paid`, so the grace calculation does not call Stripe.

### Output
`access_policy`.

### Quality Gate
- Every Stripe subscription status listed in the API reference has exactly one row (or one row per grace split).
- No row says "default"; each access value is full, read_only or none.

---

## Worked Example

Illustrative only.

User: Smart Retries, cancel after last retry, `grace_period_days` = 7 (the user's choice). Phase 1 records the retry count and window displayed in the Dashboard on 2026-10-21. Phase 2: `past_due` day 3 gives full plus banner; day 8 gives read_only; `canceled` gives none.

---

## Exit Criteria

DONE when Dashboard dunning settings are recorded as read and every subscription status has one access row the gate code can load.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | User has no Dashboard access | **Stop**: settings must be read by an account admin. |
| Phase 1 | Settings differ between test and live mode | **Adjust**: record both and ask which is intended. |
| Phase 2 | User undecided on grace access | **Return**: report the open rows; do not fill them. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
