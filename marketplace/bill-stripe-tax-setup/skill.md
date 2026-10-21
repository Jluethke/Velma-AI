# Stripe Tax for Subscriptions

**One-line description:** Enables Stripe Tax on subscriptions with a product tax code, a fixed tax behavior on every price, tax registrations for each jurisdiction where the seller is registered, and customer address and tax ID collection, verified with tax calculations per jurisdiction.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `price_catalog` (object[], required): From `bill-stripe-catalog-setup`, including each price's `tax_behavior`.
- `tax_registrations` (object[], required): Every jurisdiction where the seller is registered to collect tax, with registration type, as given by the user or their accountant. This flow does not decide where the seller must register.

---

## Outputs

- `tax_config` (object): Origin address, product tax codes, registrations created, and the parameters added to subscription and Checkout creation.
- `tax_test_results` (object[]): Per test address: jurisdiction, expected taxability from the registration list, calculated `amount_tax`, and pass or fail.

---

## Phase 1: Tax Settings and Codes

### Entry Criteria
- `tax_registrations` provided by the user. Never infer registrations from sales volume yourself.

### Actions
1. Set the head office (origin) address in Dashboard > Settings > Tax.
2. List tax codes and choose the one matching the product: `stripe get /v1/tax_codes -d limit=100` and page through; for software sold as a service pick the SaaS code whose description fits business or personal use, and record its `txcd_` ID and description.
3. Set it per product: `stripe post /v1/products/prod_X -d tax_code=txcd_...`, or set an account default in tax settings.
4. Confirm every price has `tax_behavior` set (`exclusive` adds tax on top; `inclusive` takes it out of the price). A price with `unspecified` cannot be used with automatic tax; create a replacement price with `transfer_lookup_key=true` rather than trying to change it.

### Output
Tax codes and behaviors confirmed.

### Quality Gate
- `stripe get /v1/products/prod_X` shows `tax_code` for every product.
- No price in the catalog has `"tax_behavior": "unspecified"`.

---

## Phase 2: Registrations and Collection

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Create one registration per row: `stripe post /v1/tax/registrations -d country=US -d "country_options[us][state]=CA" -d "country_options[us][type]=state_sales_tax" -d active_from=now`. EU, UK and other countries use their own `country_options` keys; read the Registrations API reference for each.
2. On every subscription create, add `automatic_tax[enabled]=true`. In Checkout Sessions add `automatic_tax[enabled]=true`, `billing_address_collection=required` or `customer_update[address]=auto` for existing customers, and `tax_id_collection[enabled]=true` for B2B.
3. Customers created through the API need an address (or a shipping address, or an IP-based location where allowed) before tax can calculate. Set `-d "address[country]=..."` and postal code, and check `tax.automatic_tax` on the customer (`expand[]=tax`): `supported` means ready; `unrecognized_location` means fix the address.
4. Store business customers' VAT or GST IDs with `stripe post /v1/customers/cus_X/tax_ids -d type=eu_vat -d value=...`; Stripe applies reverse charge where the rules call for it.

### Output
`tax_config`.

### Quality Gate
- `stripe get /v1/tax/registrations` lists every row in `tax_registrations` with `status` active.
- A test customer with a valid address shows `"automatic_tax": "supported"` in its `tax` field.

---

## Phase 3: Verify Calculations

### Entry Criteria
- Registrations exist.

### Actions
1. For each registration plus one unregistered jurisdiction, run a calculation: `stripe post /v1/tax/calculations -d currency=usd -d "line_items[0][amount]=2000" -d "line_items[0][reference]=pro" -d "line_items[0][tax_code]=txcd_..." -d "customer_details[address][country]=US" -d "customer_details[address][postal_code]=94105" -d "customer_details[address_source]=billing"`.
2. Expected: registered jurisdictions with a taxable product show `tax_amount_exclusive` greater than 0 or a documented exemption reason in `tax_breakdown`; the unregistered one shows 0 with taxability reason `not_collecting`.
3. Read `tax_breakdown[].taxability_reason` for every zero result and record it. Do not mark a zero as pass without the reason.
4. Create one test subscription with `automatic_tax[enabled]=true` and confirm the first invoice has `total_tax_amounts` (or the tax field your API version uses) matching the calculation.

### Output
`tax_test_results`.

### Quality Gate
- Every row has a recorded `taxability_reason` and the pass or fail matches the registration list.

---

## Worked Example

Illustrative only.

Registrations given by the user: US-NY and EU OSS (Ireland). Phase 2 creates both. Phase 3: a NY address returns `tax_amount_exclusive` greater than 0 with reason `standard_rated`; Texas address returns 0 with `not_collecting`; a German business with a valid `eu_vat` ID returns 0 with reason `reverse_charge`.

---

## Exit Criteria

DONE when all products have tax codes, all prices have a tax behavior, every registration is active, and every test calculation's result and reason match the registration list.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | User unsure where they must register | **Stop**: refer them to their tax advisor and Stripe's threshold monitoring report; do not guess. |
| Phase 1 | Price has `unspecified` tax behavior | **Adjust**: create a replacement price with the right behavior and move the lookup key. |
| Phase 2 | Customer tax status `unrecognized_location` | **Adjust**: collect a full billing address with postal code. |
| Phase 3 | Tax collected where not registered | **Stop**: an extra registration exists; compare the registration list with the user. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
