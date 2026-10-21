# Entitlements Model and Sync

**One-line description:** Defines each gated capability as a Stripe Entitlements feature attached to products, and keeps a local entitlements table in sync from the entitlements.active_entitlement_summary.updated webhook so in-app checks never call the billing API.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `pricing_spec` (object, required): From `bill-pricing-model-spec`; lists which plan includes which capability and any numeric limits.
- `price_catalog` (object[], required): From `bill-stripe-catalog-setup` (or the Paddle or Lemon Squeezy catalog, which uses the local-mapping path in Phase 2).
- `webhook_handler` (string, required): Handler module from the webhook flow.

---

## Outputs

- `entitlement_map` (object[]): Feature `lookup_key`, name, `feat_` ID (Stripe path), the products that grant it, and any numeric limit with its source.
- `entitlement_table_schema` (string): Migration path and DDL of `account_entitlements`.

---

## Phase 1: Define Features

### Entry Criteria
- The spec says which plans include which capabilities. If it does not, stop and ask.

### Actions
1. List capabilities as boolean features with stable snake-case lookup keys: `sso`, `audit_log`, `api_access`. One feature per capability the code checks.
2. Numeric limits (seats, projects) are not Stripe Entitlements features; store them in `entitlement_map` with the limit value from the spec and enforce them in the app (Phase 2 of the gate flow).
3. Stripe path: create each feature: `stripe post /v1/entitlements/features -d name="SSO" -d lookup_key=sso`. Attach to each product that grants it: `stripe post /v1/products/prod_X/features -d entitlement_feature=feat_...`.
4. Read back: `stripe get /v1/products/prod_X/features` for every product.

### Output
`entitlement_map`.

### Quality Gate
- For each product, the read-back feature list equals the spec's capability list for that plan (set comparison, written into the map).
- Every numeric limit cites the spec line it came from.

---

## Phase 2: Local Table and Sync

### Entry Criteria
- `entitlement_map` complete.

### Actions
1. Migration:
   ```sql
   CREATE TABLE account_entitlements (
     account_id text NOT NULL,
     feature_key text NOT NULL,
     source text NOT NULL,
     synced_at timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (account_id, feature_key)
   );
   ```
2. Stripe path: handle `entitlements.active_entitlement_summary.updated`. In the handler fetch the full list (the event may not carry every entitlement): Python `stripe.entitlements.ActiveEntitlement.list(customer=cus, limit=100)` with auto-pagination; Node `stripe.entitlements.activeEntitlements.list({ customer })`. Read each item's `lookup_key`.
3. Replace the account's rows in one transaction: `DELETE FROM account_entitlements WHERE account_id = $1` then insert the fetched keys. Replacing, not merging, removes features that were lost.
4. Merchant-of-record path: on subscription create and update events, look up the price or variant ID in `entitlement_map` and write the same table.
5. Add a nightly full resync job over all customers to repair any missed webhook.

### Output
`entitlement_table_schema` and sync handler.

### Quality Gate
- Subscribe a test customer to a plan with `sso`; within one webhook delivery `SELECT feature_key FROM account_entitlements WHERE account_id = ...` returns `sso`.
- Downgrade to a plan without `sso`; the same query no longer returns it.

---

## Worked Example

Illustrative only.

Spec: Pro includes `sso`, `audit_log`; Basic includes neither; seat limits 5 and 50. Phase 1: two features created, attached to Pro; `stripe get /v1/products/prod_Pro/features` lists both. Phase 2: test subscription to Pro triggers `entitlements.active_entitlement_summary.updated`; the table holds `sso`, `audit_log`. Plan change to Basic empties it.

---

## Exit Criteria

DONE when every capability is a feature with a stable key, the local table mirrors the provider after both upgrade and downgrade, and a resync job exists.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Spec does not say which plan has a capability | **Stop**: ask; never grant by guess. |
| Phase 2 | Event never arrives | **Adjust**: add the event to the webhook endpoint's `enabled_events`. |
| Phase 2 | Feature remains after downgrade | **Adjust**: replace rows instead of upserting. |
| Phase 2 | Resync and webhook race | **Retry**: run both inside a per-account advisory lock (`pg_advisory_xact_lock`). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
