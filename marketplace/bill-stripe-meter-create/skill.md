# Stripe Billing Meter Setup

**One-line description:** Creates one Stripe Billing Meter per usage dimension with the right aggregation formula and customer mapping, attaches a metered price to it, and proves the wiring with a test meter event read back through event summaries.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `pricing_spec` (object, required): From `bill-pricing-model-spec`; only rows with `model` = `usage` are used.
- `price_catalog` (object[], required): From `bill-stripe-catalog-setup`, to add the metered prices to the same products.

---

## Outputs

- `meter_config` (object[]): One row per usage dimension: `meter_id`, `event_name`, `aggregation_formula`, `customer_payload_key`, `value_payload_key`, metered `price_id`, `lookup_key`.

---

## Phase 1: Design Meters

### Entry Criteria
- At least one `usage` row in `pricing_spec`. If none, return an empty `meter_config`.
- The app's Stripe API version supports Billing Meters. The legacy usage-records API was removed in newer API versions; do not build on it.

### Actions
1. One meter per usage dimension, not per plan. Plans differ by price, not by meter.
2. Choose `default_aggregation[formula]`:

| What is billed | Formula | Event `value` |
|---|---|---|
| Total quantity (tokens, GB, API calls sent in batches) | `sum` | quantity in this event |
| Number of occurrences, one event each | `count` | ignored |
| A level at period end (for example storage at end) | `last` if your API version lists it; check the Meters API reference | current level |

3. Choose `event_name` in snake case, for example `api_calls`. It cannot be reused for another meter.
4. Keep the default payload keys `stripe_customer_id` and `value` unless the user has a reason; record what you choose.

### Output
Meter design table.

### Quality Gate
- Each usage spec row maps to one meter row with a formula from the table.
- No two meter rows share an `event_name`.

---

## Phase 2: Create Meters and Metered Prices

### Entry Criteria
- Meter design table complete; Stripe CLI logged in, test mode.

### Actions
1. Create the meter:
   `stripe post /v1/billing/meters -d display_name="API calls" -d event_name=api_calls -d "default_aggregation[formula]=sum" -d "customer_mapping[type]=by_id" -d "customer_mapping[event_payload_key]=stripe_customer_id" -d "value_settings[event_payload_key]=value"`
2. Create the metered price on the product from `price_catalog`:
   `stripe post /v1/prices -d product=prod_X -d currency=usd -d "recurring[interval]=month" -d "recurring[usage_type]=metered" -d "recurring[meter]=mtr_..." -d unit_amount_decimal=0.05 -d lookup_key=api_calls_usd -d tax_behavior=exclusive`
   For tiered usage add `billing_scheme=tiered`, `tiers_mode` and `tiers[...]` as in `bill-stripe-catalog-setup`.
3. A metered subscription item has no `quantity`. Do not pass one when subscribing.

### Output
Meters and metered prices.

### Quality Gate
- `stripe get /v1/billing/meters/mtr_...` shows `"status": "active"` and the chosen formula.
- `stripe get /v1/prices/price_...` shows `"usage_type": "metered"` and the meter ID.

---

## Phase 3: Prove With a Test Event

### Entry Criteria
- A test customer `cus_T` exists.

### Actions
1. Send one event: `stripe post /v1/billing/meter_events -d event_name=api_calls -d "payload[stripe_customer_id]=cus_T" -d "payload[value]=25" -d identifier=meter-proof-001`.
2. Meter aggregation is asynchronous. Read the summary after the delay the docs describe: `stripe get /v1/billing/meters/mtr_.../event_summaries -d customer=cus_T -d start_time=<hour start unix> -d end_time=<next hour unix>`. `start_time` and `end_time` must align to the window boundaries the API states.
3. Send the same `identifier` again. The summary must not change; the identifier deduplicates.
4. Write `meter_config` to `billing/meter_config.json`.

### Output
`meter_config`.

### Quality Gate
- The event summary `aggregated_value` equals 25 after both sends.
- `billing/meter_config.json` parses and has one row per usage spec row.

---

## Worked Example

Illustrative only.

Usage row `api_calls_usd`, sum, 0.05 cents per call. Phase 2 meter create returns `"id": "mtr_test_61R..."`, `"event_name": "api_calls"`. Phase 3: two posts with `identifier=meter-proof-001`; `event_summaries` returns `{"data":[{"aggregated_value":25.0,...}]}`.

---

## Exit Criteria

DONE when each usage dimension has an active meter, a metered price linked to it, and a test event proven to aggregate once.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | API version lacks meters | **Stop**: upgrade the pinned API version first; record it as an open question for the app team. |
| Phase 2 | `event_name` already in use | **Adjust**: choose a new name; meters cannot share one. |
| Phase 3 | Summary empty | **Retry**: wait and query again; confirm the customer ID and time window are right. |
| Phase 3 | Duplicate identifier counted twice | **Stop**: you used two different identifiers or two meters; inspect the posted bodies. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
