# Stripe Payout Reconciliation

**One-line description:** Reconciles each Stripe payout to the balance transactions it contains and to your own order, refund and dispute ledger, in integer settlement-currency minor units, and reports every unmatched or mismatched line.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `test_env` (object, required): Output of `pay-test-mode-setup`.
- `database` (string, required): `postgres`, `mysql` or `sqlite` holding orders, refunds and disputes.
- `currency_exponents` (object, required): Output of `pay-money-minor-units`.

---

## Outputs

- `reconciliation_report` (object): Per payout: payout id, amount, sum of contained balance transactions, difference, and lists of unmatched provider lines and unmatched internal lines.

---

## Phase 1: Pull the Payout and Its Transactions

### Entry Criteria
- The account uses automatic payouts. Listing balance transactions by payout is documented for automatic payouts only; for manual payouts, reconcile by date range and record that limit.

### Actions
1. List recent payouts: Python `stripe.Payout.list(limit=10)`; record `id`, `amount`, `currency`, `arrival_date`, `status`. Use only `status == "paid"` payouts for final reconciliation.
2. For one payout, list its transactions:
   ```python
   txns = list(stripe.BalanceTransaction.list(payout=po_id, limit=100).auto_paging_iter())
   ```
   Node: `stripe.balanceTransactions.list({ payout: poId, limit: 100 })` with auto-pagination. CLI: `stripe balance_transactions list --payout po_...`.
3. Save each transaction: `id`, `type` (`charge`, `refund`, `adjustment`, `payout`, `stripe_fee`, and others), `amount`, `fee`, `net`, `currency`, `source`.
4. For a larger history, use the Reporting API itemized payout reconciliation report (see Stripe Reports docs for the current report type names) and download the CSV.

### Output
Transaction list per payout.

### Quality Gate
- The saved list length equals the count the iterator returned (no truncation at the first page).

---

## Phase 2: Check the Payout Arithmetic

### Entry Criteria
- Transaction list saved.

### Actions
1. Sum `net` over every transaction except the one whose `type` is `payout`. Compare with the payout `amount`. All values are integers in the settlement currency's minor units.
2. Expected: sum of `net` equals payout `amount`. The `payout` type row itself carries the negative of the payout amount; exclude it from the sum or the total is zero.
3. If not equal, list transactions by `type` and recheck pagination before calling it a mismatch.

### Output
Difference value per payout.

### Quality Gate
- A printed line per payout `po_... payout=<amount> sum_net=<sum> diff=<diff>`, with `diff` = 0 or an explanation.

---

## Phase 3: Match to the Internal Ledger

### Entry Criteria
- Phase 2 diff is 0.

### Actions
1. For `type = charge` (or `payment`): `source` is a charge id; retrieve the charge's `payment_intent` and match your order's `payment_intent_id`. Compare amounts after currency conversion only through the balance transaction's own `amount` (settlement currency).
2. For `type = refund` (or `payment_refund`): match `source` (`re_...`) to your `refunds.provider_refund_id`.
3. For dispute-related types (`adjustment` with a dispute source): match to `disputes.dispute_id`.
4. Produce two lists: provider lines with no internal match, and internal records in the payout window with no provider line.
5. Do not edit ledger rows to force a match. Each unmatched line is a finding.

### Output
`reconciliation_report`.

### Quality Gate
- Every transaction has either a match or is in the unmatched list; counts add up to the transaction total.
- The report states the payout ids covered.

---

## Worked Example

Illustrative, test mode. Pay twice with `4000 0000 0000 0077` (funds go to available balance immediately), refund one partially, then create a test payout if your test account allows it.

```
po_1Qr...  payout=8417  sum_net=8417  diff=0
  txn_1 charge  amount=4900 fee=<fee> net=<net>  -> order 8812 OK
  txn_2 charge  amount=4900 fee=<fee> net=<net>  -> order 8813 OK
  txn_3 refund  amount=-500 fee=0 net=-500       -> refund re_3Qn... OK
unmatched provider: []
unmatched internal: []
```

---

## Exit Criteria

DONE when each paid payout's transactions sum to its amount and every transaction is matched or listed as a finding.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Account on manual payouts | **Adjust**: reconcile by `available_on` date windows; record the limitation. |
| Phase 2 | `diff` not 0 | **Retry**: re-pull with auto-pagination; if still nonzero, **Return** the list for finance review. |
| Phase 3 | Charge without an order | **Return**: list it; it may be a payment created outside the app. |
| Phase 3 | Multi-currency amounts differ | **Adjust**: compare only settlement amounts from balance transactions. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
