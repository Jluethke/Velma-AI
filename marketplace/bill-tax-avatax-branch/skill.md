# AvaTax on Stripe Invoices

**One-line description:** Computes sales tax for Stripe subscription invoices with the Avalara AvaTax REST v2 API while the invoice is a draft, adds the tax to the invoice before finalization, and commits, refunds or voids the AvaTax document as the Stripe invoice is paid, credited or voided.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `price_catalog` (object[], required): From `bill-stripe-catalog-setup`; prices used here must not have Stripe automatic tax enabled.
- `tax_registrations` (object[], required): Jurisdictions where the seller collects tax, also configured as nexus in the AvaTax company.
- `avatax_company_code` (string, required): The AvaTax company code.

---

## Outputs

- `tax_integration_code` (string): Paths to the draft-invoice tax function, the state-change handlers, and their tests.
- `tax_test_results` (object[]): Per test address: AvaTax `totalTax`, the Stripe invoice tax line, the AvaTax document status after each Stripe state change, and pass or fail.

---

## Phase 1: Connect and Look Up Codes

### Entry Criteria
- AvaTax sandbox account; credentials in `AVATAX_ACCOUNT_ID` and `AVATAX_LICENSE_KEY`. Base URL `https://sandbox-rest.avatax.com` (production `https://rest.avatax.com`).
- Stripe automatic tax is off for these subscriptions. Never run both engines on the same invoice.

### Actions
1. Test the connection: `curl -s -u "$AVATAX_ACCOUNT_ID:$AVATAX_LICENSE_KEY" https://sandbox-rest.avatax.com/api/v2/utilities/ping` must return `"authenticated": true`.
2. Find the tax code for the product with the definitions endpoint (`GET /api/v2/definitions/taxcodes` with a `$filter` on description) and record the code and its description. Do not use a code from memory.
3. Confirm nexus in AvaTax matches `tax_registrations` (`GET /api/v2/companies/{companyId}/nexus`).

### Output
Connection proof, tax code, nexus list.

### Quality Gate
- Ping shows `"authenticated": true`.
- The nexus list and `tax_registrations` contain the same jurisdictions (set comparison recorded).

---

## Phase 2: Tax the Draft Invoice

### Entry Criteria
- Phase 1 gate passed; webhook endpoint handles `invoice.created`.

### Actions
1. Subscription invoices start as drafts and Stripe waits before finalizing them, so tax must be added in the `invoice.created` handler (read the draft-window rules in Stripe's invoice docs). Skip invoices where `status` is not `draft`.
2. Build the AvaTax request from the invoice lines: `POST /api/v2/transactions/create` with `type` = `SalesInvoice`, `companyCode`, `code` = the Stripe invoice ID (so the document can be found later), `date`, `customerCode` = Stripe customer ID, `addresses.shipTo` from the customer address, `addresses.shipFrom` the origin, `lines` with `number`, `amount` in major units as a decimal, `taxCode`, and `commit` = false.
3. Use `type` = `SalesOrder` for quotes and previews; it is not saved and not reported.
4. Add the tax to the draft invoice: `stripe.InvoiceItem.create(customer=cus, invoice=inv_id, amount=total_tax_minor, currency=..., description="Sales tax")`. Convert `totalTax` to minor units with decimal rounding to the currency's minor unit; never float math.
5. If AvaTax fails, keep the invoice in draft by setting `auto_advance=false` (`stripe.Invoice.modify(inv_id, auto_advance=False)`), alert, and retry; finalize only after tax is added.
6. The first invoice of a new subscription is finalized at creation, with no draft window. For it, run a `SalesOrder` calculation before creating the subscription and pass the tax as a one-time item with `add_invoice_items` on the subscription create call; then record the `SalesInvoice` document when `invoice.paid` arrives. Confirm this behavior for your API version in Stripe's subscription invoice docs.

### Output
Draft-invoice tax function.

### Quality Gate
- A test subscription's first invoice (via `add_invoice_items`) and its first renewal invoice (via the draft handler, after a test clock advance) each show a "Sales tax" line equal to the AvaTax `totalTax` in minor units.
- `GET /api/v2/companies/{companyCode}/transactions/{invoiceId}` returns the document with `status` `Saved` (uncommitted).

---

## Phase 3: Follow Invoice State

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Map Stripe events to AvaTax calls:

| Stripe event | AvaTax call |
|---|---|
| `invoice.paid` | `POST /api/v2/companies/{companyCode}/transactions/{code}/commit` with `{"commit": true}` |
| `invoice.voided` | `POST .../transactions/{code}/void` with `{"code": "DocVoided"}` |
| `credit_note.created` for a paid invoice | `POST .../transactions/{code}/refund` with the refund type and lines matching the credit note |
| `invoice.marked_uncollectible` | Ask the user's accountant whether to void; record the answer, do not decide |

2. Make each call idempotent: read the document status first and skip if already in the target state.
3. Record each state in `tax_test_results`.

### Output
`tax_integration_code` and `tax_test_results`.

### Quality Gate
- After paying the test invoice, the AvaTax document `status` reads `Committed`.
- After voiding a second test invoice, the document reads `Cancelled` (AvaTax's status name for voided documents; confirm in the response).

---

## Worked Example

Illustrative only.

Invoice `in_1Q...` subtotal 2000 USD, customer in a registered jurisdiction. Phase 2: `transactions/create` returns `"totalTax": 1.78`; invoice item 178 added; document `Saved`. Phase 3: `invoice.paid` triggers commit; GET shows `Committed`.

---

## Exit Criteria

DONE when draft invoices get AvaTax tax before finalization and the AvaTax document follows every paid, voided and credited state.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Ping not authenticated | **Stop**: credentials or environment mismatch (sandbox vs production). |
| Phase 2 | Invoice finalized before tax added | **Adjust**: set `auto_advance=false` on create and finalize explicitly after tax. |
| Phase 2 | AvaTax address validation error | **Return**: ask the customer for a complete address; keep the invoice draft. |
| Phase 3 | Commit fails because document missing | **Retry**: rerun Phase 2 for that invoice in `SalesInvoice` mode, then commit. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
