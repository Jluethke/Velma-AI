# Revenue Metrics From Billing Data

**One-line description:** Computes MRR and its movements (new, expansion, contraction, churned, reactivation) plus logo churn and revenue churn from synced subscription data with SQL, using normalization conventions the user states up front, and ties the result back to invoiced revenue.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `billing_data_source` (object, required): Where subscription data lives: the app's synced tables, Stripe Sigma, Stripe Data Pipeline into a warehouse, or a Paddle or Lemon Squeezy export, with table names.
- `metrics_period` (object, required): Month or months to compute, as UTC start and end.
- `mrr_conventions` (object, optional): Which statuses count (for example whether `past_due` counts and whether `trialing` is excluded), how to normalize weekly and daily intervals, how to treat discounts, and how to treat metered revenue. Default: ask the user for each; the flow reports unanswered ones as open questions.

---

## Outputs

- `mrr_report` (object[]): Per month: starting MRR, new, expansion, contraction, churned, reactivation, ending MRR, in minor units per currency, and the conventions used.
- `churn_report` (object[]): Per month: customers at start, customers churned, logo churn rate, revenue churn rate, net revenue retention, with formulas shown.

---

## Phase 1: Build a Daily MRR Snapshot

### Entry Criteria
- `billing_data_source` reachable; read-only credentials.

### Actions
1. Build one normalized view with one row per subscription item per day: `day`, `customer_id`, `subscription_id`, `currency`, `status`, `unit_amount`, `quantity`, `interval`, `interval_count`, `discount`.
2. Monthly amount per item:

| `interval` | Monthly amount |
|---|---|
| month | `unit_amount * quantity / interval_count` |
| year | `unit_amount * quantity / (12 * interval_count)` |
| week, day | per `mrr_conventions`; if absent, record an open question and exclude these items |

   For tiered prices compute the amount from the tiers at the current quantity, not `unit_amount`.
3. Subtract recurring discounts per `mrr_conventions` (percent off applies to the item amount; one-time discounts excluded). Metered revenue: per convention, use the last fully invoiced period's usage amount or exclude it. Never mix conventions across months.
4. Keep currencies separate. Convert only if the user supplies the rate source and date.
5. Include only statuses the convention counts. Keep all arithmetic in integer minor units or SQL `numeric`.
6. Snapshot per customer: `SELECT day, customer_id, currency, sum(monthly_amount) AS mrr FROM item_mrr GROUP BY 1,2,3`.

### Output
`customer_mrr_daily` table or view.

### Quality Gate
- For three sample customers, the snapshot MRR on one day equals a hand computation from their Stripe subscription objects (record each).
- `SELECT count(*) FROM item_mrr WHERE monthly_amount IS NULL` returns 0 (no item silently dropped).

---

## Phase 2: Movements and Churn

### Entry Criteria
- Snapshot exists for the last day of the month before `metrics_period` and every month-end in it.

### Actions
1. Compare each customer's MRR at the previous month-end (`m0`) and this month-end (`m1`):

| Condition | Movement |
|---|---|
| `m0 = 0`, `m1 > 0`, customer never had MRR before | new |
| `m0 = 0`, `m1 > 0`, customer had MRR before | reactivation |
| `m0 > 0`, `m1 > m0` | expansion = `m1 - m0` |
| `0 < m1 < m0` | contraction = `m0 - m1` |
| `m0 > 0`, `m1 = 0` | churned = `m0` |

2. Check identity: starting + new + reactivation + expansion - contraction - churned = ending. Compute it in SQL and store the difference; it must be 0.
3. Churn formulas (state them in the report):
   - logo churn rate = customers churned in month / customers with `m0 > 0`
   - revenue churn rate = (churned + contraction) / starting MRR
   - net revenue retention = (starting + expansion - contraction - churned) / starting MRR
4. Cross-check: sum of `amount_paid` on paid invoices in the month should be explainable by MRR plus one-time charges plus annual prepayments; report the gap, do not force it to zero.

### Output
`mrr_report` and `churn_report`.

### Quality Gate
- The movement identity difference is 0 for every month and currency.
- Each rate row shows numerator and denominator values, not only the ratio.

---

## Worked Example

Illustrative only.

October 2026, USD. Start MRR 1,000,000 (minor units). New 120,000; expansion 40,000; contraction 15,000; churned 30,000; reactivation 5,000. End 1,120,000; identity difference 0. Customers at start 400, churned 12: logo churn 12/400 = 3.0%. Revenue churn (30,000 + 15,000)/1,000,000 = 4.5%. NRR (1,000,000 + 40,000 - 15,000 - 30,000)/1,000,000 = 99.5%.

---

## Exit Criteria

DONE when each month has balanced MRR movements per currency, churn rates with their inputs, and the conventions used are listed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Convention missing for an interval or status | **Return**: list it as an open question; exclude and label the affected items. |
| Phase 1 | Hand check disagrees with snapshot | **Adjust**: check tier math, quantity and discount handling for that customer. |
| Phase 2 | Identity difference not 0 | **Stop**: a customer is missing from one snapshot or classified twice; find it before reporting. |
| Phase 2 | Mixed currencies summed | **Adjust**: split by currency. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
