# Usage Reconciliation Against Stripe

**One-line description:** Reconciles local outbox usage totals against Stripe meter event summaries per customer and window, classifies each difference, and corrects over-reported events with meter event adjustments of type cancel inside the documented cancellation window.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `meter_config` (object[], required): From `bill-stripe-meter-create`.
- `usage_outbox_schema` (string, required): From `bill-usage-event-capture`.
- `reconcile_window` (object, optional): Start and end (UTC) to reconcile. Default: the last fully elapsed UTC day.

---

## Outputs

- `reconcile_report` (object[]): Per customer, meter and window: local total, Stripe total, difference, classification, and action taken.
- `meter_adjustments` (object[]): Each cancel adjustment sent: identifier, event name, response status.

---

## Phase 1: Pull Both Totals

### Entry Criteria
- The reporter has run past the window end, so rows in the window had a chance to send.

### Actions
1. Local totals for reported rows in the window, by `occurred_at` (the billing time, not `created_at`):
   ```sql
   SELECT customer_ref, event_name, sum(value) AS local_total, count(*) AS n
   FROM usage_outbox
   WHERE reported_at IS NOT NULL AND occurred_at >= :start AND occurred_at < :end
   GROUP BY 1, 2;
   ```
2. Stripe totals per customer and meter: `stripe get /v1/billing/meters/mtr_.../event_summaries -d customer=cus_X -d start_time=<start> -d end_time=<end>`. Align start and end to the boundaries the API requires (check the reference; misaligned values are rejected). Sum `aggregated_value` across returned rows. Paginate with `starting_after` until `has_more` is false.
3. For a `count` meter compare `n` with the Stripe total; for `sum` compare `local_total`.
4. Use exact decimal comparison (Python `decimal.Decimal`, or SQL `numeric`), never floats.

### Output
Paired totals table.

### Quality Gate
- Every customer and meter pair with local rows in the window has a Stripe total (zero counts as a value).
- Pagination ended with `has_more` false for every query (log it).

---

## Phase 2: Classify and Correct

### Entry Criteria
- Paired totals exist.

### Actions
1. Classify each pair:

| Condition | Class | Action |
|---|---|---|
| Equal | match | none |
| Stripe lower, unreported or late rows exist for the window | pending | rerun reporter, reconcile again |
| Stripe lower, no such rows | lost | list identifiers missing in Stripe; resend them (same identifier) if inside the timestamp window |
| Stripe higher | over-reported | find events sent twice under different identifiers or sent from another system; cancel extras |

2. To find over-reported events you need their identifiers. If they came from this outbox, look for duplicate business facts with different identifiers: `SELECT event_name, customer_ref, occurred_at, value, count(*) FROM usage_outbox GROUP BY 1,2,3,4 HAVING count(*) > 1`.
3. Cancel an over-reported event: `stripe post /v1/billing/meter_event_adjustments -d event_name=api_calls -d type=cancel -d "cancel[identifier]=<identifier>"`. Adjustments are only accepted within a limited time after the event; read the window in the API reference. Outside it, record a credit for the user to approve (credit note or negative invoice item) instead.
4. Fix the root cause in capture (identifier construction) before closing; reconciliation is a check, not the fix.
5. Do not edit `aggregated_value` expectations or delete outbox rows to make totals match.

### Output
`reconcile_report` and `meter_adjustments`.

### Quality Gate
- After corrections and a re-query, every pair is class `match` or carries a recorded credit for user approval.
- Each `meter_adjustments` row has the API response `status`.

---

## Worked Example

Illustrative only.

Window 2026-10-20 UTC. `cus_A api_calls`: local 1200, Stripe 1200, match. `cus_B`: local 300, Stripe 350; the duplicate query shows two rows with value 50 at the same `occurred_at` and identifiers `api_calls:req_9` and `api_calls:req_9-retry`. Send cancel for `api_calls:req_9-retry`; re-query returns 300. Root cause: the client retry appended a suffix; capture fixed to strip it.

---

## Exit Criteria

DONE when every pair in the window matches or has a recorded, user-approvable credit, and each over-report root cause is identified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Summary query rejected for time bounds | **Adjust**: align start and end to the documented boundaries. |
| Phase 2 | Adjustment rejected as too old | **Return**: record a credit for user approval; do not resend negative values. |
| Phase 2 | Over-report source not in the outbox | **Stop**: another system writes to the meter; list API keys and integrations with the user. |
| Phase 2 | Pending class persists | **Retry**: run the reporter and reconcile again; if still pending, inspect `last_error`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
