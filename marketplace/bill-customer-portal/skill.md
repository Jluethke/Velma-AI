# Stripe Customer Portal

**One-line description:** Creates a Stripe customer portal configuration whose allowed plan switches, proration behavior and cancellation mode match the price catalog and refund policy, and creates portal sessions, including flow_data deep links for payment method update and cancellation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `price_catalog` (object[], required): From `bill-stripe-catalog-setup`; lists which prices customers may switch between.
- `refund_policy` (object, required): Same policy used by `bill-cancel-refund-policy`; decides the portal cancel mode.
- `return_url` (string, required): The app URL customers return to after the portal.

---

## Outputs

- `portal_configuration_id` (string): The `bpc_...` configuration ID and its read-back settings.
- `portal_session_code` (string): Path to the session-create endpoint and its tests.

---

## Phase 1: Configure the Portal

### Entry Criteria
- Business name, terms URL and privacy URL available for `business_profile`.

### Actions
1. Map policy to settings:

| Policy | Portal setting |
|---|---|
| Self-serve cancel at period end | `features[subscription_cancel][enabled]=true`, `features[subscription_cancel][mode]=at_period_end` |
| Self-serve cancel immediately | `mode=immediately` plus `proration_behavior` per policy |
| No self-serve cancel | `features[subscription_cancel][enabled]=false` |
| Plan switching allowed | `features[subscription_update][enabled]=true` with `products[]` and `prices[]` listing only switchable prices |

2. Create the configuration:
   ```
   stripe post /v1/billing_portal/configurations \
     -d "business_profile[headline]=Manage your subscription" \
     -d "features[payment_method_update][enabled]=true" \
     -d "features[invoice_history][enabled]=true" \
     -d "features[subscription_cancel][enabled]=true" \
     -d "features[subscription_cancel][mode]=at_period_end" \
     -d "features[subscription_update][enabled]=true" \
     -d "features[subscription_update][default_allowed_updates][]=price" \
     -d "features[subscription_update][proration_behavior]=create_prorations" \
     -d "features[subscription_update][products][0][product]=prod_X" \
     -d "features[subscription_update][products][0][prices][]=price_A" \
     -d "features[subscription_update][products][0][prices][]=price_B"
   ```
   Add `default_allowed_updates[]=quantity` only for per-seat plans. Use the same `proration_behavior` that `bill-plan-change-proration` uses for self-serve changes.
3. Metered prices and prices on multi-item subscriptions have portal limitations; read the portal docs and exclude what is unsupported.
4. Read back: `stripe get /v1/billing_portal/configurations/bpc_...`.

### Output
`portal_configuration_id`.

### Quality Gate
- Read-back `features.subscription_cancel.mode` and `features.subscription_update.proration_behavior` equal the mapped values.
- Every price in `products[].prices` is in `price_catalog` and active.

---

## Phase 2: Session Endpoint

### Entry Criteria
- Configuration exists.

### Actions
1. Server endpoint, authenticated, resolving the Stripe customer from the logged-in account (never from a request parameter):
   Python `stripe.billing_portal.Session.create(customer=cus, return_url=return_url, configuration="bpc_...")`; Node `stripe.billingPortal.sessions.create({ customer, return_url, configuration })`. Redirect to `session.url`.
2. Deep links with `flow_data`: `{"type": "payment_method_update"}` for dunning banners; `{"type": "subscription_cancel", "subscription_cancel": {"subscription": sub_id}}` for a cancel button; `subscription_update_confirm` for a pre-chosen plan switch. Check the `flow_data` types in the reference.
3. Session URLs are short-lived; create one per click, never store it.
4. Portal changes arrive as normal subscription webhooks; no portal-specific handler is needed beyond the existing ones.

### Output
`portal_session_code`.

### Quality Gate
- A test calls the endpoint as user A and asserts the session's `customer` is A's customer ID; calling with another account's ID in the body has no effect.
- In test mode, cancelling through the portal produces `customer.subscription.updated` with `cancel_at_period_end` true (when mode is `at_period_end`).

---

## Worked Example

Illustrative only.

Policy: cancel at period end; switch between Basic and Pro monthly. Phase 1 returns `bpc_1Q...`; read-back shows `"mode": "at_period_end"`. Phase 2: dunning banner link creates a session with `flow_data[type]=payment_method_update` and opens straight to the card form.

---

## Exit Criteria

DONE when the portal configuration matches the policy and catalog on read-back and sessions are created only for the authenticated account's customer.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Configuration rejects a price | **Adjust**: remove unsupported (for example metered) prices from switchable lists. |
| Phase 1 | Policy disallows self-serve cancel but product needs it legally in some regions | **Stop**: ask the user to confirm with counsel; record the answer. |
| Phase 2 | Session for wrong customer | **Stop**: fix customer resolution to use the session user only. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
