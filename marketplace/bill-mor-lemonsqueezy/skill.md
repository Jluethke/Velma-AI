# Lemon Squeezy Variants and Webhooks

**One-line description:** Maps Lemon Squeezy products and variants to the pricing spec, verifies X-Signature webhooks, and implements plan changes, cancellations and usage records through the Lemon Squeezy JSON:API.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `pricing_spec` (object, required): From `bill-pricing-model-spec`.
- `lemonsqueezy_store_id` (string, required): The numeric store ID, from `GET /v1/stores`.

---

## Outputs

- `ls_variant_map` (object[]): Spec `key` to Lemon Squeezy product ID and variant ID, with price, interval and whether usage-based billing is on, as read back from the API.
- `ls_webhook_code` (string): Path to the webhook endpoint module, its tests, and the subscribed event list.

---

## Phase 1: Map Variants

### Entry Criteria
- An API key from Settings > API is in the environment variable `LEMONSQUEEZY_API_KEY`. Test mode is on for the store while building.

### Actions
1. Every request uses `https://api.lemonsqueezy.com/v1/`, headers `Accept: application/vnd.api+json`, `Content-Type: application/vnd.api+json`, `Authorization: Bearer $LEMONSQUEEZY_API_KEY`.
2. Create products and variants in the dashboard (Store > Products); each subscription plan or interval is a variant. Check the API reference: if it lists no create endpoint for products, do not try to script creation.
3. Read them back: `curl -s "https://api.lemonsqueezy.com/v1/variants?filter[product_id]=<id>" -H ...`. For each variant record `price` (minor units), `interval`, `interval_count`, `is_subscription`, and the usage-based flag shown in the variant attributes (check the attribute name in the API reference).
4. For `usage` spec rows, the variant must have usage-based billing enabled in the dashboard. For `graduated` or `volume` rows, confirm the variant's pricing model options in the dashboard; if not available, return the row as an open question.
5. Compare every variant price to `unit_amount_minor` and write `ls_variant_map`.

### Output
`ls_variant_map`.

### Quality Gate
- Every spec row maps to one variant ID and the API `price` equals the spec amount.
- `git grep -n "LEMONSQUEEZY_API_KEY="` finds no hard-coded key value in the repo.

---

## Phase 2: Verify Webhooks

### Entry Criteria
- A webhook is created (Settings > Webhooks or `POST /v1/webhooks`) with a signing secret stored in `LEMONSQUEEZY_WEBHOOK_SECRET`.

### Actions
1. Read the raw body bytes before parsing JSON.
2. Compute HMAC-SHA256 of the raw body with the signing secret, hex encode, and compare with the `X-Signature` header using a constant-time compare. Reject with 400 on mismatch.
3. Read the event type from the `X-Event-Name` header or `meta.event_name` in the body.
4. Deduplicate: Lemon Squeezy bodies carry no event ID field you can rely on across retries, so build a key from `meta.event_name` + `data.id` + `data.attributes.updated_at` and store it with a unique constraint.
5. Return 200 fast, then process.

### Output
Verified webhook endpoint.

### Quality Gate
- A test with a tampered body gets 400; a test with the correct signature gets 200.
- Posting the same payload twice processes it once (one row in the dedupe table).

---

## Phase 3: Subscription Actions and Usage

### Entry Criteria
- Phase 2 tests pass.

### Actions
1. Handle events (names are the API literals, spelling as Lemon Squeezy sends them):

| `X-Event-Name` | Action |
|---|---|
| `subscription_created` | Store subscription ID, variant ID, status; grant entitlements. |
| `subscription_updated` | Replace stored status, variant, `renews_at`, `ends_at`. |
| `subscription_cancelled` | Keep access until `ends_at`; status is `cancelled` in the grace period. |
| `subscription_expired` | Revoke access. |
| `subscription_payment_failed` | Apply past-due access rule; notify. |
| `subscription_payment_recovered` | Restore access. |

2. Plan change: `PATCH /v1/subscriptions/{id}` with body `{"data":{"type":"subscriptions","id":"{id}","attributes":{"variant_id":N}}}`. Add `"invoice_immediately":true` to charge the prorated difference now, or `"disable_prorations":true` to skip proration; pick by the user's plan change policy, never by default.
3. Cancel: `DELETE /v1/subscriptions/{id}` cancels at period end; the subscription can be resumed with a PATCH setting `cancelled` to false until `ends_at`.
4. Usage: report with `POST /v1/usage-records` body `{"data":{"type":"usage-records","attributes":{"quantity":Q,"action":"increment"},"relationships":{"subscription-item":{"data":{"type":"subscription-items","id":"<item id>"}}}}}`. Use `increment` for deltas and `set` for absolute totals; never mix them for one item in one period.
5. Customer portal: read `data.attributes.urls.customer_portal` from `GET /v1/subscriptions/{id}`; the URL is signed and expires, so fetch it on each click, never store it.

### Output
`ls_webhook_code`.

### Quality Gate
- A test-mode subscription walked through create, plan change, cancel and resume produces the tabled stored status after each webhook.
- `GET /v1/subscription-items/{id}/current-usage` returns the quantity the test reported.

---

## Worked Example

Illustrative only.

Spec `pro_monthly_usd` 2000. Phase 1: `GET /v1/variants?filter[product_id]=123` returns variant 456 with `price` 2000, `interval` "month". Phase 2: test posts body `{"meta":{"event_name":"subscription_created"}}` with wrong `X-Signature`, gets 400. Phase 3: `POST /v1/usage-records` with quantity 1200 and action `increment`; `current-usage` then reports `quantity` 1200.

---

## Exit Criteria

DONE when every spec row maps to a verified variant, webhooks are signature-checked and deduplicated, and plan change, cancel, resume and usage calls are proven in test mode.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | 401 from the API | **Stop**: key is missing, revoked, or for another store. |
| Phase 1 | Pricing model not offered on variants | **Return**: send the row back as an open question. |
| Phase 2 | Signature never matches | **Adjust**: use the raw bytes and the secret from this webhook, not the API key. |
| Phase 3 | Usage record rejected | **Adjust**: confirm the variant has usage-based billing enabled and the subscription item ID is correct. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
