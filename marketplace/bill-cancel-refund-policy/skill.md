# Cancellation and Refund Policy in Code

**One-line description:** Encodes the written cancellation and refund policy as a decision table in code that chooses between cancel_at_period_end, immediate cancellation with or without proration, credit notes and refunds, and proves each row in Stripe test mode.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `refund_policy` (object, required): The user's written policy: when cancellation takes effect, whether unused time is refunded or credited, any refund window, who may approve exceptions. Values come from the user; this flow sets none.
- `price_catalog` (object[], required): From `bill-stripe-catalog-setup`.
- `webhook_handler` (string, required): Handler module from the webhook flow.

---

## Outputs

- `cancel_refund_code` (string): Paths to the policy table file, the `cancel_subscription` and `refund_invoice` functions, and tests.
- `policy_test_results` (object[]): For each table row: inputs, Stripe calls made, resulting subscription status, credit note or refund IDs and amounts, pass or fail.

---

## Phase 1: Build the Decision Table

### Entry Criteria
- `refund_policy` answers: effective time, unused-time treatment, refund window (or none), exception approver.

### Actions
1. Translate the policy into rows with these columns: plan interval, days since period start, requester (customer or staff), reason. Each row picks one action:

| Action | Stripe calls |
|---|---|
| Cancel at period end, no refund | `Subscription.modify(id, cancel_at_period_end=True)` |
| Cancel now, no refund | `Subscription.cancel(id)` |
| Cancel now, credit unused time to balance | `Subscription.cancel(id, prorate=True)`; the proration lands as customer balance credit |
| Cancel now, refund unused time to card | `Subscription.cancel(id, prorate=True, invoice_now=True)` then credit note with refund on the paid invoice (Phase 2) |
| Full refund of last invoice | Credit note for the full paid amount with `refund_amount` |

2. Check the exact parameters for `cancel` (`prorate`, `invoice_now`) and any `cancellation_details` field in the API reference for your version.
3. Write the table as data (`billing/cancel_policy.json`); the code picks a row by matching columns and fails closed (no action, alert) when no row matches.

### Output
Decision table file.

### Quality Gate
- Every clause of `refund_policy` maps to at least one row (list clause to row IDs).
- `python -m json.tool billing/cancel_policy.json` (or Node `JSON.parse`) exits 0.

---

## Phase 2: Refunds Through Credit Notes

### Entry Criteria
- Table complete.

### Actions
1. For a paid subscription invoice, refund with a credit note, not a bare Refund, so the invoice shows the adjustment and tax is reversed proportionally:
   `stripe.CreditNote.preview(invoice=inv_id, lines=[{"type": "invoice_line_item", "invoice_line_item": line_id, "quantity": 1}], refund_amount=amount)`; check `total`, then `stripe.CreditNote.create(...)` with the same arguments. Use `amount` (or line amounts) for partial credits; read the credit note parameters in the API reference.
2. Use a bare `stripe.Refund.create(payment_intent=pi, amount=amount, reason="requested_by_customer")` only for payments with no invoice.
3. Refund amount never exceeds the invoice's paid amount minus prior credits; read `amount_paid` and existing credit notes (`stripe.CreditNote.list(invoice=inv_id)`) first.
4. Idempotency key on every create, built from the cancellation request ID.
5. Handle `customer.subscription.deleted` (remove access at the actual end time) and `credit_note.created` (record in the app ledger).

### Output
`cancel_refund_code`.

### Quality Gate
- For each preview, the created credit note `total` equals the preview `total`.
- A test that requests the same refund twice creates one credit note (`stripe get /v1/credit_notes -d invoice=in_...` lists one).

---

## Phase 3: Prove Each Row

### Entry Criteria
- Code and unit tests pass.

### Actions
1. For each table row run the scenario in test mode, using a test clock to reach the "days since period start" value.
2. Record the subscription `status`, `cancel_at_period_end`, `canceled_at`, credit note IDs and amounts in `policy_test_results`.
3. Confirm the customer portal's cancel mode (`bill-customer-portal`) matches the self-serve row; a mismatch lets customers bypass the policy.

### Output
`policy_test_results`.

### Quality Gate
- Every row has a scenario with observed values equal to the expected action.

---

## Worked Example

Illustrative only.

Policy: monthly plans cancel at period end with no refund; annual plans canceled within the user's stated refund window get a prorated refund. Row A (monthly): `cancel_at_period_end` true, status stays `active` until period end. Row B (annual, inside the window): `cancel(prorate=True, invoice_now=True)`, then a credit note preview for the unused portion, created with `refund_amount`; `stripe get /v1/credit_notes/cn_...` shows `"status": "issued"` and a `refunds` entry.

---

## Exit Criteria

DONE when the policy is a data table, every row is implemented with credit notes or the exact cancel parameters, and each row is proven in test mode.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Policy silent on a case (for example annual plan canceled mid-term) | **Stop**: ask the user; do not invent a refund rule. |
| Phase 2 | Credit note exceeds remaining amount | **Adjust**: subtract prior credit notes before computing. |
| Phase 2 | Refund created without credit note on an invoice | **Adjust**: void that path; use credit notes for invoiced payments. |
| Phase 3 | Portal cancel mode differs from policy | **Return**: update the portal configuration in `bill-customer-portal`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
