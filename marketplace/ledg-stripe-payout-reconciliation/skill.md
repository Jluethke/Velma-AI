# Ledger Stripe Payout Reconciliation

**One-line description:** Reconciles each Stripe payout against the internal ledger by pulling the payout's balance transactions from the Stripe API (amount, fee, net in minor units), proving they sum to the payout amount, and matching every transaction to a ledger entry by Stripe object id, with a break report for anything unmatched.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ledger_schema` (object, required): Output of `ledg-pg-double-entry-schema`. Journal entries must carry the Stripe object id (`ch_`, `re_`, `py_`, `txn_` or `evt_` derived) in `external_ref`.
- `processor_export` (object, required): For Stripe: the payout ids to reconcile (`po_...`), the environment variable that holds a restricted read-only secret key, and optionally an itemized payout reconciliation report CSV downloaded from the Stripe Dashboard.

---

## Outputs

- `processor_recon_report` (object): Per payout: payout amount, sum of transaction `net`, difference, counts of matched, missing-in-ledger and missing-in-Stripe rows, and each break with ids and amounts.

---

## Phase 1: Pull the Payout Transactions

### Entry Criteria
- A restricted key with read access to balance and payouts exists in the named environment variable. Never paste a key into a file or a command history; `curl -u "$STRIPE_KEY:"` reads it from the environment.
- The payouts are automatic payouts. Stripe documents that listing balance transactions by payout works for automatic payouts; for manual payouts, reconcile by date range instead (check the Stripe docs for the current rule).

### Actions
1. Fetch the payout: `curl -sS -u "$STRIPE_KEY:" https://api.stripe.com/v1/payouts/po_XXX`. Record `amount`, `currency`, `arrival_date`, `status`. Only `paid` payouts are final.
2. List its balance transactions with pagination:
```
curl -sS -G -u "$STRIPE_KEY:" https://api.stripe.com/v1/balance_transactions \
  -d payout=po_XXX -d limit=100
```
While the response has `"has_more": true`, repeat with `-d starting_after=<last id>`. `limit` maximum is 100 per the Stripe API docs.
3. Save each page as JSON. For each row keep `id`, `type`, `reporting_category`, `amount`, `fee`, `net`, `currency`, `source`, `created`, `available_on`. All amounts are integers in the currency's smallest unit per Stripe (check Stripe's zero-decimal and special-case currency list when converting to the ledger exponent).
4. Do not parse amounts as floats when loading JSON; they are integers already.

### Output
Raw transaction list per payout.

### Quality Gate
- The last page saved has `"has_more": false`.
- Row count equals the number of ids collected, and ids are unique.

---

## Phase 2: Prove the Payout Sum

### Entry Criteria
- Raw list exists.

### Actions
1. Separate any row with `type` = `payout` (the payout's own movement). Sum `net` of all other rows.
2. The sum must equal the payout `amount`. If a `payout` row is present, its `amount` must equal the negative of the payout `amount`.
3. Break the sum down by `reporting_category` (for example `charge`, `refund`, `fee`, `dispute`) for the report.
4. If the user supplied the itemized payout reconciliation CSV from the Dashboard, sum its net column per payout and confirm it equals the API sum. Report differences; do not reconcile against two sources that disagree.

### Output
Per-payout sum proof.

### Quality Gate
- Difference between summed `net` and payout `amount` is 0 for every payout, or the payout is listed as a break with the difference.

---

## Phase 3: Match to the Ledger

### Entry Criteria
- Sum proof done.

### Actions
1. Load the transaction rows into a scratch table (`CREATE TEMP TABLE stripe_txn (...)`) with `\copy` from CSV or with a script that inserts integers.
2. Match by id, never by amount alone:
```
SELECT t.id, t.source, t.net, e.id AS entry_id
FROM stripe_txn t LEFT JOIN journal_entries e ON e.external_ref IN (t.source, t.id)
WHERE e.id IS NULL;                       -- missing in ledger
```
and the reverse: ledger entries with a Stripe `external_ref` whose effective date falls in the payout window and that appear in no fetched transaction (missing in Stripe).
3. For each match, compare amounts: the ledger's postings to the Stripe receivable or clearing account for that entry must equal `amount`, and the fee posting must equal `fee`. Record any difference as an amount break.
4. Classify breaks: `missing_in_ledger` (webhook lost; replay the event through the idempotent posting service), `missing_in_stripe` (timing: transaction will be in a later payout, or a wrong ref), `amount_mismatch` (fee or currency exponent bug).
5. Post the payout itself as a journal entry (Stripe clearing to bank in transit) only after the payout sums to zero difference.

### Output
`processor_recon_report`.

### Quality Gate
- Every transaction row has a status: matched, `missing_in_ledger`, or `amount_mismatch`.
- The report counts add up: matched plus breaks equals the transaction row count.

---

## Worked Example

Illustrative only.
```
$ curl -sS -u "$STRIPE_KEY:" https://api.stripe.com/v1/payouts/po_1Qx | jq '{amount,currency,status}'
{ "amount": 1843210, "currency": "usd", "status": "paid" }
$ jq -s '[.[].data[] | select(.type != "payout") | .net] | add' page*.json
1843210
```
Phase 3: 312 rows, 311 matched, 1 `missing_in_ledger` (`ch_3Qy...` net 4870; its `charge.succeeded` webhook returned 500 on 2026-10-18). Replayed through `post_entry` with key `evt_...`; rerun shows 312 matched.

---

## Exit Criteria

DONE when every payout's transactions are fully paged, sum to the payout amount, and every row is matched to a ledger entry by id or listed as a classified break.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | HTTP 401 or 403 | **Stop**: the key lacks permission; ask the user for a restricted key with read access. |
| Phase 1 | HTTP 429 | **Retry**: back off and resume from the last saved `starting_after`. |
| Phase 2 | Sum differs from payout amount | **Return**: report the difference and the categories; do not post the payout entry. |
| Phase 3 | Many `missing_in_ledger` | **Adjust**: check webhook delivery logs in the Dashboard before replaying, then replay with original event ids as keys. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
