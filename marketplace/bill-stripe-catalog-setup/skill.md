# Stripe Catalog Setup

**One-line description:** Creates Stripe Products and Prices with lookup keys from the pricing spec using the Stripe CLI in test mode, encodes per-unit, graduated and volume tiers exactly, and verifies each price with an invoice preview against the spec's worked examples.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `pricing_spec` (object, required): From `bill-pricing-model-spec`.
- `stripe_api_version` (string, optional): The API version the app pins, for example the value shown in Dashboard > Developers. Default: the account's default version, read and recorded in Phase 1.

---

## Outputs

- `price_catalog` (object[]): Spec `key` to `prod_` ID, `price_` ID and `lookup_key`, with `billing_scheme`, `tiers_mode`, `recurring`, `tax_behavior` and amounts as read back from Stripe.

---

## Phase 1: Prepare

### Entry Criteria
- Stripe CLI installed (`stripe version` prints a version) and logged in (`stripe login`).
- Work in test mode. The CLI uses test mode unless `--live` is passed; never pass `--live` in this flow.

### Actions
1. Record the API version: `stripe get /v1/account` does not show it; read it from Dashboard > Developers > API version, or use `stripe_api_version`. Pass it on every CLI call with `--stripe-version <version>` so results match what the app will see.
2. Decide `tax_behavior` now (`exclusive` or `inclusive`) with the user. It can be set once on a price and then cannot be changed; a wrong value means creating new prices.
3. Check for existing prices with the same lookup keys: `stripe get /v1/prices -d "lookup_keys[]=pro_monthly_usd"`. If one exists, stop and ask whether to replace it.

### Output
API version, tax behavior choice, and a clean lookup key namespace.

### Quality Gate
- The lookup-key query returns `"data": []` for every spec key, or the user approved replacement in writing.
- `tax_behavior` is recorded as exactly `exclusive` or `inclusive`.

---

## Phase 2: Create Products and Prices

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Create each product: `stripe post /v1/products -d name="Pro" -d "metadata[spec_product]=pro"`.
2. Flat or per-seat price:
   `stripe post /v1/prices -d product=prod_X -d currency=usd -d unit_amount=2000 -d "recurring[interval]=month" -d lookup_key=pro_monthly_usd -d tax_behavior=exclusive`
   Per-seat uses the same price; the seat count is the subscription item `quantity`.
3. Graduated tiers:
   `stripe post /v1/prices -d product=prod_X -d currency=usd -d "recurring[interval]=month" -d billing_scheme=tiered -d tiers_mode=graduated -d "tiers[0][up_to]=10" -d "tiers[0][unit_amount]=500" -d "tiers[1][up_to]=inf" -d "tiers[1][unit_amount]=400" -d lookup_key=seats_graduated_usd -d tax_behavior=exclusive`
   For volume, use `tiers_mode=volume`. A tier can also carry `flat_amount`. The last tier must have `up_to=inf`.
4. Usage prices are created in `bill-stripe-meter-create`, because a metered price needs `recurring[meter]`. Skip `usage` rows here.
5. Do not change an existing price's amount. Prices are immutable in amount; to change a price, create a new one with `-d transfer_lookup_key=true` so the lookup key moves to the new price.
6. Read back each price: `stripe get /v1/prices -d "lookup_keys[]=<key>" -d "expand[]=data.tiers"`. Tiers are only returned when expanded.

### Output
Prices in Stripe and `price_catalog` rows.

### Quality Gate
- For each non-usage spec row, the read-back price has the same `unit_amount` or the same `tiers` array (compare field by field).
- Every price has a `lookup_key` equal to the spec `key`.

---

## Phase 3: Verify Charges

### Entry Criteria
- All non-usage prices exist.

### Actions
1. Create a test customer: `stripe post /v1/customers -d email=catalog-test@example.com`.
2. For each spec example, preview the first invoice without creating a subscription. Use the Create Preview Invoice endpoint (`POST /v1/invoices/create_preview`) with `customer`, `subscription_details[items][0][price]` and `subscription_details[items][0][quantity]`. Older API versions use `GET /v1/invoices/upcoming`; check which one your `stripe_api_version` supports.
3. Compare the preview `subtotal` to the example's expected charge. Do not adjust the expected number to match Stripe; a mismatch means the encoding or the spec is wrong.
4. Write `price_catalog` to `billing/price_catalog.json`.

### Output
`price_catalog`.

### Quality Gate
- Every spec example's preview `subtotal` equals the expected charge; the comparison table is saved with the catalog.
- `billing/price_catalog.json` parses as JSON.

---

## Worked Example

Illustrative only.

Spec row `seats_graduated_usd` with tiers [1-10 at 500, 11+ at 400], example quantity 11 expects 5400.

- Phase 1: `stripe get /v1/prices -d "lookup_keys[]=seats_graduated_usd"` returns `"data": []`.
- Phase 2: the graduated create command returns `"id": "price_1Q..."`, `"tiers_mode": "graduated"`.
- Phase 3: `stripe post /v1/invoices/create_preview -d customer=cus_T -d "subscription_details[items][0][price]=price_1Q..." -d "subscription_details[items][0][quantity]=11"` returns `"subtotal": 5400`. Match.

---

## Exit Criteria

DONE when every non-usage spec row exists as a Stripe price with its lookup key and every worked example matches the invoice preview subtotal.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Lookup key already used | **Stop**: ask the user; replacing it changes what live code resolves. |
| Phase 2 | `tiers` rejected | **Adjust**: ensure tiers are ordered by `up_to`, the last is `inf`, and `billing_scheme=tiered` is set. |
| Phase 2 | Wrong amount on a created price | **Adjust**: create a corrected price with `transfer_lookup_key=true`, then archive the old one with `-d active=false`. |
| Phase 3 | Preview subtotal differs | **Return**: report both numbers to `bill-pricing-model-spec`; graduated vs volume is the usual cause. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
