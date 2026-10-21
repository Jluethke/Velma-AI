# Stripe Plan Changes and Proration

**One-line description:** Implements Stripe plan upgrades and downgrades with an explicit proration_behavior chosen from a policy table, previews the prorated invoice before committing with a fixed proration_date, and schedules period-end downgrades through Subscription Schedules.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `price_catalog` (object[], required): From `bill-stripe-catalog-setup`.
- `plan_change_policy` (object, required): For upgrades and for downgrades separately: when the change applies (now or at period end) and how the price difference is billed (charge now, credit on next invoice, or nothing). Seat changes: same two fields.
- `webhook_handler` (string, required): Handler module from the webhook flow.

---

## Outputs

- `plan_change_code` (string): Paths to the preview function, the change function and the schedule function.
- `proration_previews` (object[]): For each test change: from price, to price, proration date, preview line items and total, and the invoice total after commit.

---

## Phase 1: Map Policy to Parameters

### Entry Criteria
- `plan_change_policy` defines upgrade, downgrade and seat change rules.

### Actions
1. Map each rule with this table:

| Policy | Call | `proration_behavior` | Other params |
|---|---|---|---|
| Change now, charge the difference now | Subscription update | `always_invoice` | `payment_behavior=pending_if_incomplete` |
| Change now, difference on next invoice | Subscription update | `create_prorations` | |
| Change now, no proration | Subscription update | `none` | |
| Change now and restart the period | Subscription update | `create_prorations` or `none` | `billing_cycle_anchor=now` |
| Change at period end | Subscription Schedule | phase change at `current_period_end` | |

2. `pending_if_incomplete` means: if the immediate charge fails, the change is not applied and the subscription keeps its old items. Use it for every upgrade billed now.
3. Changing the interval (monthly to yearly) resets the billing cycle; tell the user and confirm the policy row.

### Output
Parameter table per change type.

### Quality Gate
- Every policy row maps to exactly one table row; none says "default".

---

## Phase 2: Preview, Then Commit

### Entry Criteria
- Parameter table complete.

### Actions
1. Fetch the subscription and the item to change: `sub = stripe.Subscription.retrieve(sub_id)`; `item_id = sub["items"]["data"][0]["id"]`. Change the existing item ID; adding a new item without removing the old one bills both.
2. Fix the proration time once: `proration_date = int(time.time())`.
3. Preview with the Create Preview Invoice endpoint: Python `stripe.Invoice.create_preview(customer=cus, subscription=sub_id, subscription_details={"items": [{"id": item_id, "price": new_price}], "proration_behavior": pb, "proration_date": proration_date})`; Node `stripe.invoices.createPreview({...})`. On API versions before `create_preview` exists, use the upcoming invoice endpoint; check your pinned version.
4. Show the customer the preview `total` and the proration lines (lines whose `proration` flag is true; check the line field name in your version).
5. Commit with the same `proration_date`: `stripe.Subscription.modify(sub_id, items=[{"id": item_id, "price": new_price}], proration_behavior=pb, proration_date=proration_date, payment_behavior=...)`. The same date makes the committed amounts equal the preview.
6. Seat change: same call with `quantity` on the item instead of `price`.
7. Add an idempotency key per change request.

### Output
Preview and change functions.

### Quality Gate
- For an upgrade test with `always_invoice`, the resulting `latest_invoice` `total` equals the preview `total`.
- With a card that declines (`pm_card_chargeDeclined` set as default), the upgrade raises an error and `stripe get /v1/subscriptions/sub_...` still shows the old price.

---

## Phase 3: Period-End Downgrades

### Entry Criteria
- Policy says a downgrade applies at period end.

### Actions
1. Create a schedule from the live subscription: `sched = stripe.SubscriptionSchedule.create(from_subscription=sub_id)`.
2. Update it with two phases: the current phase (copy its `items`, `start_date` from `sched.phases[0]`, `end_date` = current period end) and the next phase with the lower price and `iterations` or no end. `stripe.SubscriptionSchedule.modify(sched.id, phases=[...], end_behavior="release")`.
3. `end_behavior="release"` returns the subscription to normal after the last phase so later changes do not need the schedule.
4. If the customer upgrades again before period end, release or cancel the pending phase first: `stripe.SubscriptionSchedule.release(sched.id)` and then apply the upgrade with Phase 2.
5. Handle `subscription_schedule.updated` and `customer.subscription.updated` to refresh entitlements when the phase switches.

### Output
`plan_change_code` and `proration_previews`.

### Quality Gate
- With a test clock advanced past the period end, the subscription shows the lower price and the invoice for the new period bills it with no proration lines.

---

## Worked Example

Illustrative only.

Monthly Basic 1000 to Pro 3000, upgrade policy "now, charge now", halfway through the period. Phase 2 preview: proration line about -500 (unused Basic) and about +1500 (remaining Pro), total about 1000; exact cents depend on seconds remaining. Commit with the same `proration_date` gives a paid invoice with the same total. Phase 3: downgrade Pro to Basic at period end; after the clock advance the subscription item price is Basic and the invoice is 1000.

---

## Exit Criteria

DONE when every policy row has a tested code path, commits equal their previews, failed upgrades leave the old plan, and period-end downgrades switch on schedule.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Policy silent on billing the difference | **Stop**: ask the user; do not choose a proration behavior. |
| Phase 2 | Committed total differs from preview | **Adjust**: pass the same `proration_date` to both calls. |
| Phase 2 | Customer billed for two plans | **Adjust**: update the existing item ID instead of adding a new item. |
| Phase 3 | "subscription is managed by a schedule" error on update | **Adjust**: release the schedule first, then update. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
