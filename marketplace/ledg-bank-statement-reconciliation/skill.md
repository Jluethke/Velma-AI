# Ledger Bank Statement Reconciliation

**One-line description:** Reconciles a bank account's statement export (ISO 20022 camt.053 XML, BAI2, or bank CSV) against the ledger's cash account: parses amounts as exact integers, proves opening plus entries equals closing, then matches by reference, then by amount within a user-set date window, and lists every break.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ledger_schema` (object, required): Output of `ledg-pg-double-entry-schema`.
- `bank_export` (object, required): File path, format (`camt053`, `bai2`, `csv`), the bank account id, the ledger cash account code it maps to, and for CSV the column names for date, amount, sign or debit/credit columns, and reference.
- `match_date_window_days` (integer, required): How many days apart a bank booking date and a ledger effective date may be for an amount-only match. A business choice; the user supplies it.

---

## Outputs

- `bank_recon_report` (object): Statement opening and closing balances, the balance proof result, counts matched by reference, matched by amount and window, unmatched bank lines, unmatched ledger postings, and each break with details.

---

## Phase 1: Parse the Statement Exactly

### Entry Criteria
- `bank_export` file exists and its format is one of the three.

### Actions
1. Parse by format:

| Format | Where the data is |
|---|---|
| camt053 | Root `Document/BkToCstmrStmt/Stmt`. Balances in `Bal` with `Tp/CdOrPrtry/Cd` = `OPBD` (opening booked) and `CLBD` (closing booked). Each `Ntry` has `Amt` with a `Ccy` attribute, `CdtDbtInd` (`CRDT` or `DBIT`), `BookgDt/Dt`, `ValDt/Dt`, `AcctSvcrRef`, and under `NtryDtls/TxDtls/Refs` the `EndToEndId`. Read the XML namespace from the root element (it includes the message version, for example `camt.053.001.02`) and use it in every path. |
| bai2 | Records by code: `01` file header, `02` group header, `03` account identifier with summary amounts by type code, `16` transaction detail (type code, amount, funds type, bank reference, customer reference, text), `88` continuation, `49` account trailer, `98` group trailer, `99` file trailer. Amounts are implied two decimals with no decimal point; type codes define credit or debit (see the BAI2 specification's type code table from the bank). |
| csv | Columns from `bank_export`. Read with the `csv` module or equivalent, never a spreadsheet program that reformats numbers. |

2. Convert every amount from its text form to integer minor units with the decimal string parser from the stack money module. Apply sign: `DBIT` or a debit type code is negative to the bank account.
3. Read the statement's currency and confirm it equals the ledger cash account currency.

### Output
Statement lines with integer amounts, dates and references.

### Quality Gate
- Line count equals the number of `Ntry` elements (camt053), `16` records (bai2) or data rows (csv).
- No amount was parsed through a float type: the parser code contains no `float(`, `parseFloat` or `ParseFloat`.

---

## Phase 2: Prove the Statement Balances

### Entry Criteria
- Lines parsed.

### Actions
1. Compute `opening + sum(lines)` and compare with closing. For camt053 use `OPBD` and `CLBD`; for bai2 use the opening and closing ledger summary type codes the bank documents in its `03` record; for csv the user supplies both balances.
2. If the proof fails, stop matching. A failed proof means the file is incomplete or mis-parsed.
3. Compare the statement opening balance with the ledger cash account balance at the statement start (from `ledg-pg-balance-snapshots` queries). A difference here is a carried-forward break from a prior reconciliation.

### Output
Balance proof result.

### Quality Gate
- `opening + sum(lines) - closing` equals 0.

---

## Phase 3: Match and Report

### Entry Criteria
- Proof passed.

### Actions
1. Load statement lines into a temp table. Load ledger postings for the cash account with effective dates in the statement range widened by `match_date_window_days` on both sides.
2. Pass 1, reference match: statement `EndToEndId` or customer reference equals `journal_entries.external_ref`. Each side can match at most once.
3. Pass 2, amount and window: for unmatched lines, find unmatched postings with equal `amount_minor` and `abs(booking_date - effective_date) <= match_date_window_days`. If more than one candidate exists, do not auto-match; list as `ambiguous`.
4. Pass 3, one-to-many: processor payouts appear as one bank line for many ledger entries. Match a bank line to the ledger's payout entry (posted by `ledg-stripe-payout-reconciliation`), not to the individual charges.
5. Report breaks: `bank_only` (fee, interest, chargeback not yet posted), `ledger_only` (in transit or not yet cleared), `ambiguous`. Never post an adjusting entry automatically; list proposed entries for a person to approve.

### Output
`bank_recon_report`.

### Quality Gate
- Matched plus `bank_only` plus `ambiguous` equals the statement line count.
- No statement line or ledger posting is matched twice: a `GROUP BY` on each side's id in the match table has no count above 1.

---

## Worked Example

Illustrative only. camt.053 for October 20, `match_date_window_days` = 3 (user choice).
```
$ python recon_bank.py --format camt053 stmt_2026-10-20.xml
namespace urn:iso:std:iso:20022:tech:xsd:camt.053.001.02
entries 47  opening 12500000  sum 1843210  closing 14343210  proof OK
pass1 reference 44  pass2 amount+window 1  pass3 payout 1
bank_only 1: -2500 'MONTHLY SERVICE FEE' 2026-10-20
```
The fee line becomes a proposed entry (bank fees expense / cash) for approval.

---

## Exit Criteria

DONE when the statement parses to exact integers, its balance proof holds, every line is matched once or listed as a break, and no adjusting entry was posted without approval.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | camt namespace version differs from expected | **Adjust**: read it from the root element; element names above are stable across common versions, but check the bank's implementation guide. |
| Phase 1 | Currency mismatch | **Stop**: wrong account mapping in `bank_export`. |
| Phase 2 | Proof fails | **Stop**: ask for a complete statement; do not match a partial file. |
| Phase 3 | Many `ambiguous` lines | **Adjust**: ask the bank or processor to include references; never pick the first candidate. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
