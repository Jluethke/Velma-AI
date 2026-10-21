# Billing Provider Selection

**One-line description:** Chooses between Stripe Billing (you are the seller of record) and a merchant-of-record provider (Paddle or Lemon Squeezy) from tax, entity and product facts using a fixed decision table, so the rest of the billing build targets one provider.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `product_profile` (object, required): What is sold and how: digital software or SaaS vs physical goods vs services, pricing models needed (flat, per-seat, tiered, volume, usage-based), expected invoice-based (net terms) enterprise deals yes/no, existing payment provider if any.
- `seller_jurisdictions` (string[], required): Countries and states where the selling entity is incorporated or already registered for sales tax, VAT or GST.
- `sell_to_consumers` (boolean, optional): True when buyers include consumers (B2C) and not only businesses. Default: ask the user; do not assume.

---

## Outputs

- `billing_provider` (string): Exactly one of "stripe", "paddle", "lemonsqueezy".
- `provider_rationale` (object[]): One row per decision-table rule evaluated: rule, input fact, result, and the provider documentation page that supports it.

---

## Phase 1: Collect Facts

### Entry Criteria
- `product_profile` and `seller_jurisdictions` are present.

### Actions
1. Write each fact as a yes/no answer in a table with these exact rows: F1 "product is digital software or SaaS only", F2 "need usage-based (metered) pricing", F3 "need invoice with net payment terms (send_invoice) for enterprise", F4 "entity will register and file sales tax, VAT or GST itself in every place it must", F5 "need full control of checkout UI and payment data", F6 "sells to consumers", F7 "existing Stripe account with live subscriptions".
2. For any row the inputs do not answer, ask the user. Do not guess an answer for F4 or F6; they decide who is liable for tax.
3. Open the current merchant-of-record product pages for Paddle (paddle.com) and Lemon Squeezy (lemonsqueezy.com) and confirm each accepts the product category in F1. Record the page URL.

### Output
A seven-row fact table, every row answered yes or no.

### Quality Gate
- The fact table has exactly rows F1 to F7 and no row is blank or "unknown".
- Each provider acceptance check cites a URL.

---

## Phase 2: Apply the Decision Table

### Entry Criteria
- Fact table complete.

### Actions
1. Apply the rules in order; the first rule that fires decides:

| Rule | Condition | Result |
|---|---|---|
| R1 | F1 = no (physical goods or services outside the merchant-of-record acceptable use) | stripe |
| R2 | F7 = yes and the user does not want to migrate live subscriptions | stripe |
| R3 | F4 = no (entity will not register and file tax itself) | go to R5 |
| R4 | F4 = yes | stripe |
| R5 | F2 = yes or F3 = yes | paddle (check Paddle's current support for the needed usage or invoicing feature in its docs and record the page) |
| R6 | otherwise | paddle or lemonsqueezy: ask the user to choose after reading both fee pages; record the choice |

2. If R5 or R6 picks a merchant of record, state in `provider_rationale` that the merchant of record is the legal seller and collects and remits tax, so the app must not add its own tax engine.
3. If the result is stripe and F4 = yes, record that tax will be handled by Stripe Tax or a tax API (the `tax_engine` choice later in the chain).
4. Do not compare fee percentages from memory. If the user wants a cost comparison, copy the current numbers from each provider's pricing page with the URL and the date read.

### Output
`billing_provider` and `provider_rationale`.

### Quality Gate
- `billing_provider` is one of the three allowed strings.
- `provider_rationale` lists every rule evaluated up to and including the one that fired.
- Any fee number in the rationale has a URL and a read date.

---

## Worked Example

Illustrative only.

Input: `product_profile` = B2B analytics SaaS, per-seat plus API usage, no net-terms deals; `seller_jurisdictions` = ["US-DE"]; `sell_to_consumers` = false.

- Phase 1: F1 yes, F2 yes, F3 no, F4 no (founder will not file EU VAT), F5 no, F6 no, F7 no.
- Phase 2: R1 no, R2 no, R3 fires (F4 = no) so go to R5; R5 fires (F2 = yes). Output `billing_provider` = "paddle", with a rationale row citing the Paddle docs page for usage charges.

---

## Exit Criteria

DONE when `billing_provider` holds one allowed value and every rule evaluated is recorded with the fact it used.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | User cannot answer F4 (tax registration) | **Stop**: tax liability decides the provider; ask the user to confirm with their accountant before continuing. |
| Phase 1 | Product category not accepted by either merchant of record | **Return**: set `billing_provider` = "stripe" with R1 as the rationale. |
| Phase 2 | User overrides the table result | **Adjust**: record the override and the user's reason as a rationale row; keep the user's choice. |
| Phase 2 | Needed feature missing in the chosen merchant of record's docs | **Return**: re-run Phase 2 with that provider excluded. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
