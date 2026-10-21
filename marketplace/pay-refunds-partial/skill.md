# Full and Partial Refunds

**One-line description:** Implements full and partial Stripe refunds against a PaymentIntent with integer minor-unit amounts, a per-line idempotency key and a server-side remaining-balance check, tracks refund status through `refund.updated` and `charge.refunded` webhooks, and tests the asynchronous refund-failure card.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `idempotency_audit` (object[], required): Output of `pay-idempotency-keys`.
- `currency_exponents` (object, required): Output of `pay-money-minor-units`.

---

## Outputs

- `refund_procedure` (object): Refund function, the refundable-amount rule, the status table, webhook handling, and test results for full, partial, over-refund and failed refund.

---

## Phase 1: Refundable Amount Rule

### Entry Criteria
- Orders store `amount`, `currency` and `payment_intent_id`.

### Actions
1. Add a `refunds` table: `id`, `order_id`, `amount` (integer minor units), `reason`, `provider_refund_id`, `status`, `idempotency_key` (unique).
2. Refundable = order `amount` minus the sum of refunds whose status is `pending`, `requires_action` or `succeeded`. Compute in integers.
3. Reject any request where requested amount is not a positive integer or exceeds refundable. Stripe also rejects an amount above the remaining charge amount, but check first so the user gets a clear message.
4. Admin input arrives in major units as a string; convert with the minor-unit helper, never with `float * 100`.

### Output
Rule and table.

### Quality Gate
- Unit tests: refund 500 of 1999 leaves 1499; a second refund of 1500 is rejected; refund of 0 is rejected.

---

## Phase 2: Create the Refund

### Entry Criteria
- Phase 1 tests pass.

### Actions
1. Insert the `refunds` row with status `requested` and key `refund:<order_id>:<refund_row_id>` before calling the API.
2. Call:
   - Python: `stripe.Refund.create(payment_intent=pi_id, amount=amt, reason="requested_by_customer", metadata={"order_id": oid}, idempotency_key=key)`
   - Node: `stripe.refunds.create({ payment_intent, amount, reason: 'requested_by_customer', metadata }, { idempotencyKey: key })`
   - Go: `refund.New(&stripe.RefundParams{PaymentIntent: stripe.String(pi), Amount: stripe.Int64(amt), Reason: stripe.String(string(stripe.RefundReasonRequestedByCustomer))})` with `SetIdempotencyKey`
   Omit `amount` only for a full refund of the remaining balance.
3. Allowed `reason` values: `duplicate`, `fraudulent`, `requested_by_customer`. Use `fraudulent` only when it truly is; Stripe uses it as a fraud signal.
4. Store `refund.id` (`re_...`) and `refund.status`.
5. Status table:
   | Status | Meaning | Your state |
   |---|---|---|
   | `pending` | Submitted, not final | `pending` |
   | `requires_action` | Customer action needed (some payment methods) | `pending`, notify support |
   | `succeeded` | Done | `succeeded` |
   | `failed` | Bank or card rejected it; Stripe returns funds to your balance | `failed`; contact customer for another route |
   | `canceled` | Canceled | `canceled` |

### Output
Refund function.

### Quality Gate
- `stripe refunds list --payment-intent pi_... ` (or SDK list with `payment_intent`) shows the refund with the expected `amount`.

---

## Phase 3: Webhooks and Tests

### Entry Criteria
- `stripe listen` running with `--events charge.refunded,refund.created,refund.updated,refund.failed`. Check your CLI and the API events list for the names available on your API version.

### Actions
1. Handle `refund.updated` (and `refund.failed` if listed): look up the `refunds` row by `provider_refund_id`, re-fetch the refund, set status forward only.
2. Handle `charge.refunded` to update the order's refunded total (`charge.amount_refunded`), comparing with your own sum.
3. Tests with test mode:
   | Case | Steps | Expected |
   |---|---|---|
   | Full | Pay 1999 with `4242...`, refund without amount | `succeeded`, `amount_refunded` 1999 |
   | Partial | Pay 1999, refund 500 | `succeeded`, refundable 1499 |
   | Over-refund | Refund 2000 on 1999 | Rejected by your Phase 1 check |
   | Async failure | Pay with `4000 0000 0000 5126`, refund | Refund first `succeeded` or `pending`, then a webhook moves it to `failed` (confirm card behavior in Stripe testing docs) |
4. Record every case.

### Output
`refund_procedure`.

### Quality Gate
- Four cases recorded with `re_` ids and final statuses read from `stripe refunds retrieve re_...`.

---

## Worked Example

Illustrative. Python, order 8812 paid 1999 USD.

```
>>> stripe.Refund.create(payment_intent="pi_3Qn...", amount=500, reason="requested_by_customer", idempotency_key="refund:8812:1")
<Refund id=re_3Qn... amount=500 status=succeeded>
```
Listen: `--> charge.refunded [evt_...]  <-- [200]`. Refundable now 1499. Over-refund of 2000 returns HTTP 422 from your API with "exceeds refundable amount 1499".

---

## Exit Criteria

DONE when full and partial refunds are idempotent, bounded by a server-side remaining balance, tracked by webhook, and all four test cases are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Historical refunds not recorded locally | **Adjust**: backfill rows from `Refund.list(payment_intent=...)` before enabling partial refunds. |
| Phase 2 | `charge_already_refunded` | **Return**: show fully refunded; sync local rows from the API. |
| Phase 2 | Network timeout | **Retry**: same idempotency key. |
| Phase 3 | Refund `failed` | **Return**: mark failed and route to support; do not silently create a new refund. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
