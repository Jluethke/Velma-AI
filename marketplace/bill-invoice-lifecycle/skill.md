# Stripe Invoice Lifecycle Map

**One-line description:** Configures Stripe invoice collection (charge_automatically or send_invoice with days_until_due) and maps every invoice status and invoice event to one application action, including the draft window for edits and the rules for void versus uncollectible.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `price_catalog` (object[], required): From `bill-stripe-catalog-setup`.
- `collection_method` (string, required): "charge_automatically" (card or debit on file) or "send_invoice" (customer pays an emailed invoice). Enterprise net-terms customers use `send_invoice`.

---

## Outputs

- `invoice_settings` (object): Collection method, `days_until_due` (user input when `send_invoice`), invoice numbering scheme, footer and memo source, and the Dashboard settings read back.
- `invoice_event_map` (object[]): Each invoice event with its handler, the database fields it writes, and its idempotency key.

---

## Phase 1: Collection Settings

### Entry Criteria
- `collection_method` is one of the two values.

### Actions
1. For `send_invoice`, get `days_until_due` from the user (contract terms, for example net 30). It is required by Stripe for that method; do not choose one.
2. Set it per subscription: `collection_method=send_invoice` and `days_until_due=N` on subscription create.
3. Read Dashboard > Settings > Billing > Invoices: numbering (account-level sequence or per customer), default footer, default payment terms. Record what is set; change only with user approval.
4. Status reference used by the app:

| Status | Meaning | App may |
|---|---|---|
| `draft` | Editable; not sent or charged | add or remove items, set `auto_advance` |
| `open` | Finalized, awaiting payment | nothing on amounts; void or mark uncollectible |
| `paid` | Settled | issue credit notes |
| `uncollectible` | Written off, still payable | accept late payment |
| `void` | Canceled, never payable | nothing |

5. Subscription renewal invoices stay in draft for a window before finalizing (see Stripe's docs on `invoice.created`), which is where tax or extra items get added. The first invoice of a new subscription finalizes immediately.

### Output
`invoice_settings`.

### Quality Gate
- `invoice_settings` lists the method and, for `send_invoice`, a `days_until_due` value with the user as its source.
- A test subscription read back with `stripe get /v1/subscriptions/sub_...` shows the same `collection_method`.

---

## Phase 2: Event Map

### Entry Criteria
- Webhook endpoint exists.

### Actions
1. Map events to actions:

| Event | Action | Idempotency key |
|---|---|---|
| `invoice.created` | Add draft-window items (tax, usage corrections) | invoice ID + step |
| `invoice.finalized` | Store number, `hosted_invoice_url`, `invoice_pdf` | invoice ID |
| `invoice.paid` | Mark period paid; clear dunning state | invoice ID |
| `invoice.payment_failed` | Hand to `bill-payment-failure-handler` | event ID |
| `invoice.payment_action_required` | Prompt customer to authenticate | event ID |
| `invoice.upcoming` | Optional pre-renewal notice; sent ahead of renewal per the configured days in Dashboard | invoice period |
| `invoice.marked_uncollectible` | Apply access policy row for `uncollectible` | invoice ID |
| `invoice.voided` | Remove amount from receivables view | invoice ID |

2. Use `invoice.paid`, not `invoice.payment_succeeded`, as the "settled" signal; `invoice.paid` also fires for invoices paid out of band (`paid_out_of_band=true`).
3. Never edit an `open` invoice's amounts. To correct, void it (if unpaid and wrong) or issue a credit note (if paid or partly paid). Decision: unpaid and wrong amount, void then re-invoice; paid, credit note.
4. Store invoice fields in an `invoices` table keyed by Stripe invoice ID; upsert on each event, guarded by the event's `created` time so older events do not overwrite newer state.

### Output
`invoice_event_map`.

### Quality Gate
- `stripe trigger invoice.paid` and `stripe trigger invoice.payment_failed` each produce one row update visible with `SELECT status, updated_at FROM invoices WHERE stripe_id = ...`.
- Handler unit tests pass (test runner exit code 0).

---

## Worked Example

Illustrative only.

`collection_method` = `send_invoice`, user gives net 30. Phase 1: subscription created with `days_until_due=30`; read-back shows `"collection_method": "send_invoice"`. Phase 2: `invoice.finalized` stores `hosted_invoice_url`; customer pays by bank transfer recorded as out of band (`stripe post /v1/invoices/in_.../pay -d paid_out_of_band=true`); `invoice.paid` marks it settled.

---

## Exit Criteria

DONE when collection settings are set from user-supplied terms and every listed invoice event has a tested, idempotent handler.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `send_invoice` without `days_until_due` | **Stop**: ask the user for contract terms. |
| Phase 2 | Attempt to edit an open invoice | **Adjust**: void and re-invoice, or issue a credit note, per the decision rule. |
| Phase 2 | Older event overwrote status | **Adjust**: compare event `created` with the stored timestamp before writing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
