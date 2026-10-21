# Pricing Model Spec

**One-line description:** Encodes a human pricing sheet as a machine-checkable spec in which every price is one of flat, per-seat, graduated tiers, volume tiers or usage-based, with worked charge examples that later flows use as test vectors.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `pricing_sheet` (string, required): The pricing page, spreadsheet or document describing plans, intervals, currencies, seat rules and usage charges.
- `billing_provider` (string, required): "stripe", "paddle" or "lemonsqueezy", from `bill-provider-select`.

---

## Outputs

- `pricing_spec` (object): A JSON document at `billing/pricing_spec.json` with one entry per price: `key`, `product`, `model`, `currency`, `interval`, `interval_count`, `unit_amount_minor`, `tiers`, `usage_dimension`, `trial_days`, and `examples` (quantity in, expected charge out in minor units).
- `pricing_open_questions` (string[]): Every rule the sheet leaves ambiguous, phrased as a question for the user. Empty when none.

---

## Phase 1: Classify Each Price

### Entry Criteria
- `pricing_sheet` and `billing_provider` are present.

### Actions
1. List every plan and every charge line in the sheet (base fee, seat fee, each usage charge, each add-on).
2. Classify each line with this table:

| Sheet says | `model` | Stripe encoding |
|---|---|---|
| One fixed price per interval | `flat` | `billing_scheme=per_unit`, quantity 1 |
| Price times number of users or seats | `per_seat` | `billing_scheme=per_unit`, quantity = seats on the subscription item |
| Each unit priced by the band it falls in (first 10 at A, next 40 at B) | `graduated` | `billing_scheme=tiered`, `tiers_mode=graduated` |
| All units priced at the band the total reaches | `volume` | `billing_scheme=tiered`, `tiers_mode=volume` |
| Charge per measured unit of consumption, billed in arrears | `usage` | `recurring[usage_type]=metered` with a Billing Meter |

3. When the sheet says "tiered" without saying whether every unit gets the top band price, add an open question; graduated and volume give different charges for the same quantity.
4. Convert every amount to integer minor units (cents). Never store a float. For zero-decimal currencies such as JPY the minor unit is the whole unit; check the provider's currency list.
5. Give each price a stable `key` such as `pro_monthly_usd`. Stripe calls this a `lookup_key`; the app will look prices up by it, never by hard-coded price IDs.

### Output
Draft spec rows, one per price, each with a `model`.

### Quality Gate
- Every charge line in the sheet maps to exactly one spec row (count lines in the sheet and rows in the spec; they match).
- No amount in the spec contains a decimal point.

---

## Phase 2: Write Worked Charge Examples

### Entry Criteria
- Draft spec rows exist.

### Actions
1. For each tiered price, write at least one example at each tier boundary and one just above it, computed by hand. Example graduated tiers [1-10 at 500, 11+ at 400]: quantity 10 = 5000, quantity 11 = 5400. Volume with the same tiers: quantity 11 = 4400.
2. For each per-seat price, write examples for 1 seat and for the largest seat count the sheet mentions.
3. For each usage price, write the unit of measure, the aggregation (sum of values or count of events), and an example period total.
4. If `billing_provider` is "paddle" or "lemonsqueezy", mark any `graduated` or `volume` row and any `usage` row with a note to confirm support in that provider's docs; record unsupported ones as open questions.
5. Write `billing/pricing_spec.json` and validate it parses: `python -m json.tool billing/pricing_spec.json` or `node -e "JSON.parse(require('fs').readFileSync('billing/pricing_spec.json'))"`.

### Output
`pricing_spec` and `pricing_open_questions`.

### Quality Gate
- The JSON validation command exits 0.
- Every tiered row has an example at each `up_to` boundary.
- Every open question names the sheet line it came from.

---

## Worked Example

Illustrative only.

Input sheet: "Team plan $20/user/month; API calls: first 10,000 free, then $0.50 per 1,000."

- Phase 1: row `team_monthly_usd` model `per_seat` unit_amount_minor 2000; row `api_calls_usd` model `graduated`, usage dimension `api_calls`, tiers [{up_to: 10000, unit_amount_decimal: "0"}, {up_to: "inf", unit_amount_decimal: "0.05"}] (0.05 cents per call). Open question: is the free 10,000 per month or per billing period for annual plans?
- Phase 2: examples 10,000 calls = 0; 12,000 calls = 100 (2,000 x 0.05 cents). `python -m json.tool billing/pricing_spec.json` prints the document and exits 0.

---

## Exit Criteria

DONE when every sheet line is a spec row with a model, integer minor-unit amounts and hand-computed examples, and every ambiguity is an open question.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Sheet line fits no model | **Stop**: add it to `pricing_open_questions`; do not invent a model. |
| Phase 1 | Sub-cent unit price | **Adjust**: use `unit_amount_decimal` (Stripe accepts a decimal string in minor units) and note it. |
| Phase 2 | Hand-computed example disagrees with the sheet's own example | **Return**: add an open question quoting both numbers. |
| Phase 2 | JSON does not parse | **Retry**: fix the syntax error at the reported line and rerun the check. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
