# PCI DSS Scope Reduction and SAQ Type

**One-line description:** Proves by code search and network capture that raw card data never touches your servers, logs or analytics, then maps the integration to the PCI DSS self-assessment questionnaire type the PCI SSC eligibility criteria point to, without claiming compliance.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `integration_plan` (object, required): Output of `pay-stripe-integration-choice`.
- `page_hosting` (string, required): Where the page that loads the payment form is served from, for example `own-domain-nextjs`, `own-domain-static-cdn`, `provider-hosted`.

---

## Outputs

- `pci_scope_report` (object): Fields `card_data_paths_found` (list of file:line), `log_redaction_ok` (bool), `network_capture_ok` (bool), `saq_candidate` (string), `eligibility_items_to_confirm` (list), `owner` (who signs the SAQ, from the user).

---

## Phase 1: Search Code for Card Data Handling

### Entry Criteria
- `integration_plan` present. Repository checked out locally.

### Actions
1. Run each search from the repository root and save the output:
   - `rg -n -i "card_?number|cardnumber|\bpan\b|cvc|cvv|exp_?month|exp_?year" --glob '!node_modules' --glob '!vendor'`
   - `rg -n "card\[number\]|payment_method_data\[card\]|\"number\":\s*\"4[0-9]{12,15}\""`
   - `rg -n -P "\b4[0-9]{12}(?:[0-9]{3})?\b|\b5[1-5][0-9]{14}\b|\b3[47][0-9]{13}\b"` (card-number shaped literals; test card numbers in test files are expected hits)
2. Classify each hit with this table:
   | Hit | Classification |
   |---|---|
   | Test card literal in a test file or fixture | OK, note it |
   | Server code reading a request field named like a card number or CVC | SCOPE DEFECT |
   | Server code calling the provider API with raw card fields | SCOPE DEFECT (this is the direct-API path that pushes you toward SAQ D) |
   | Client code creating its own `<input>` for card number outside the provider iframe | SCOPE DEFECT |
3. Do not edit code in this flow. Record each SCOPE DEFECT with file and line in `card_data_paths_found`.

### Output
Classified hit list.

### Quality Gate
- All three `rg` commands were run and their output saved.
- Every hit has one classification from the table.

---

## Phase 2: Prove It at Runtime

### Entry Criteria
- Phase 1 done. Test mode keys configured (see `pay-test-mode-setup`).

### Actions
1. Start the app locally, open the browser developer tools Network tab, check "Preserve log".
2. Pay once with test card `4242 4242 4242 4242`, any future expiry, any CVC.
3. Filter the Network tab by your own domain. Open every request to your backend and search its payload for `4242424242424242` and the CVC you typed. Expected: zero matches. Card fields must only go to the provider's domains (for Stripe, `api.stripe.com` and `*.stripe.com` iframes).
4. Search server logs and any error tracker or analytics events from that minute for `4242424242424242`. Expected: zero matches.
5. Set `network_capture_ok` and `log_redaction_ok` from steps 3 and 4.

### Output
Two booleans with the evidence captured (HAR export file name, log query used).

### Quality Gate
- A HAR file was exported (right-click in Network tab, "Save all as HAR") and `rg -c 4242424242424242 <file>.har` shows matches only on provider domains, checked by reading the request URLs of each match.
- The log search command and its zero-result output are recorded.

---

## Phase 3: Map to an SAQ Candidate

### Entry Criteria
- Phases 1 and 2 done.

### Actions
1. If any SCOPE DEFECT exists, set `saq_candidate` = `SAQ D (until defects removed)` and stop here.
2. Otherwise map with this table (PCI DSS v4.0.1 SAQ set; read the eligibility criteria section of the current SAQ document on the PCI SSC document library before relying on it):
   | Integration | `saq_candidate` |
   |---|---|
   | Redirect to provider-hosted page (Stripe Checkout, Payment Links, PayPal hosted approval, Adyen hosted page) | SAQ A |
   | All card fields in provider iframes on your page (Stripe Payment Element, Adyen Drop-in or Components) | SAQ A, per provider guidance; confirm the current eligibility criteria about scripts on the payment page |
   | Your page posts card data directly to the provider from your own form fields | SAQ A-EP |
   | Card data passes through your servers | SAQ D |
3. Copy the eligibility criteria bullets for the chosen SAQ into `eligibility_items_to_confirm`, each as a yes/no question for the owner.
4. Ask the user who signs the assessment and record it in `owner`. Write no statement that the merchant "is compliant".

### Output
`pci_scope_report`.

### Quality Gate
- `saq_candidate` is one value from the table.
- `eligibility_items_to_confirm` cites the SAQ document version it was copied from.
- The report contains the word "candidate" and no compliance claim.

---

## Worked Example

Illustrative. `integration_plan.surface` = `elements`, `page_hosting` = `own-domain-nextjs`.

- Phase 1: `rg` finds `tests/fixtures/cards.ts:3: "4242424242424242"` (OK) and no server hits.
- Phase 2: HAR shows `4242424242424242` only in requests sent from the Stripe iframe to `api.stripe.com`; backend `POST /api/create-payment-intent` body is `{"items":[{"id":"course-12"}]}`. Log search `grep -r 4242424242424242 logs/` returns nothing.
- Phase 3: `saq_candidate` = `SAQ A`, with eligibility items copied from the SAQ A document, including the item about protecting the payment page from script tampering.

---

## Exit Criteria

DONE when `pci_scope_report` lists every card-data path found, the runtime capture result, one SAQ candidate and the eligibility questions for the owner.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rg` not installed | **Adjust**: use `git grep -n -I -E` with the same patterns. |
| Phase 1 | Server code reads raw card numbers | **Return**: report as SCOPE DEFECT; rebuild with provider-hosted fields; never "mask and keep". |
| Phase 2 | Card number appears in your own logs | **Stop**: purge the logs per your retention process, fix the logging, rerun Phase 2. |
| Phase 3 | Integration matches no row | **Return**: record as an open question for a qualified assessor. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
