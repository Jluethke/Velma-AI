# Ledger Xero Manual Journal Sync

**One-line description:** Pushes the internal ledger's period trial balance to Xero as summary Manual Journals through the Xero Accounting API, with signed `LineAmount` values that sum to zero, the `xero-tenant-id` and `Idempotency-Key` headers, rate-limit header handling, and line-by-line verification.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `audit_query_pack` (object, required): Output of `ledg-pg-audit-queries`; all zero-row checks must pass.
- `account_mapping` (object[], required): Rows mapping each internal account code to the Xero `AccountCode`.
- `xero_tenant_id` (string, required): The Xero organization tenant id from the `GET https://api.xero.com/connections` response after OAuth.

---

## Outputs

- `xero_sync_job` (object): Sync state table DDL, the ManualJournal payload per period and currency, the returned `ManualJournalID`, the idempotency keys used, and verification results.

---

## Phase 1: Prepare

### Entry Criteria
- Every zero-row check in `audit_query_pack` passed.
- A Xero app with OAuth 2.0 credentials and a scope that allows writing manual journals. Xero has been changing its scope model; check the current scope list in the Xero developer docs and request the narrowest one that allows ManualJournals write.
- First runs go to a Xero demo company, not the live organization.

### Actions
1. Confirm every internal account with a non-zero period sum has a mapping row; stop on any gap.
2. Validate codes: `GET https://api.xero.com/api.xro/2.0/Accounts` with headers `Authorization: Bearer <token>`, `xero-tenant-id: <xero_tenant_id>`, `Accept: application/json`. Each mapped `AccountCode` must exist with `Status` `ACTIVE`.
3. Check the organization's lock dates: `GET https://api.xero.com/api.xro/2.0/Organisation` and read `PeriodLockDate` and `EndOfYearLockDate` (Xero's field names). A journal dated on or before a lock date is rejected.
4. Create a local sync table: `xero_sync(period text, currency char(3), idem_key text UNIQUE, manual_journal_id uuid, status text, synced_at timestamptz)`.

### Output
Validated mapping, lock dates, sync table.

### Quality Gate
- Missing-mapping list is empty and every code is `ACTIVE`.
- The journal date is after both lock dates.

---

## Phase 2: Build and Post

### Entry Criteria
- Phase 1 passed.

### Actions
1. Build lines from the trial balance. In Xero manual journals, a positive `LineAmount` is a debit and a negative one is a credit, and the lines must sum to zero. This matches the ledger's sign convention directly.
```
{"ManualJournals": [{
  "Narration": "LEDG 2026-10 USD summary",
  "Date": "2026-10-31",
  "Status": "POSTED",
  "LineAmountTypes": "NoTax",
  "JournalLines": [
    {"LineAmount": 18432.10, "AccountCode": "090", "Description": "cash"},
    {"LineAmount": -18432.10, "AccountCode": "200", "Description": "sales"}]}]}
```
2. Write `LineAmount` from integer minor units as exact decimal text; never through a float. Sum the minor units before sending and require 0.
3. Use `"Status": "DRAFT"` for the first run in the demo company so a person can review in the Xero UI; switch to `POSTED` after approval.
4. Send `PUT https://api.xero.com/api.xro/2.0/ManualJournals` (create) with headers `Authorization`, `xero-tenant-id`, `Content-Type: application/json`, `Accept: application/json`, and `Idempotency-Key: <key>` where the key is deterministic, for example `ledg-2026-10-USD-v1`, stored in `xero_sync` before sending. Check the Xero docs for the key's maximum length and how long Xero remembers it.
5. Read rate-limit headers on every response: `X-MinLimit-Remaining`, `X-DayLimit-Remaining`, `X-AppMinLimit-Remaining`. On HTTP 429, wait for the `Retry-After` header's seconds and resend with the same `Idempotency-Key`.
6. On HTTP 400, read `Elements[].ValidationErrors[].Message` and report it verbatim.
7. Store `ManualJournals[0].ManualJournalID` from the response.

### Output
Posted manual journal per period and currency.

### Quality Gate
- `xero_sync` has one row per period and currency with a non-null `manual_journal_id`.
- The local sum of `LineAmount` minor units is 0 for each payload.

---

## Phase 3: Verify in Xero

### Entry Criteria
- Posts succeeded.

### Actions
1. `GET https://api.xero.com/api.xro/2.0/ManualJournals/{ManualJournalID}` and compare each line's `AccountCode` and `LineAmount` with the payload.
2. Pull `GET https://api.xero.com/api.xro/2.0/Reports/TrialBalance?date=2026-10-31` and compare mapped accounts with the ledger trial balance; list differences from activity entered directly in Xero.
3. Never edit the journal in Xero to fix a difference; correct in the internal ledger and sync the next period.

### Output
`xero_sync_job`.

### Quality Gate
- Every fetched line matches the payload.
- The trial balance comparison lists each mapped account with difference 0 or an explanation.

---

## Worked Example

Illustrative only. Demo company, period 2026-10.
```
PUT /api.xro/2.0/ManualJournals   Idempotency-Key: ledg-2026-10-USD-v1
200 OK  X-MinLimit-Remaining: 58  X-DayLimit-Remaining: 4987
{"ManualJournals":[{"ManualJournalID":"7d1b...","Status":"DRAFT", ...}]}
GET /api.xro/2.0/ManualJournals/7d1b...
lines: 090 18432.10, 200 -18432.10  -> match
```

---

## Exit Criteria

DONE when each period and currency is posted once as a zero-sum manual journal with an idempotency key, the Xero object matches the payload, and trial balance differences are listed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Journal date inside a lock date | **Return**: ask the user's accountant; never move lock dates from the integration. |
| Phase 2 | HTTP 401 | **Retry**: refresh the token once and resend with the same `Idempotency-Key`. |
| Phase 2 | HTTP 429 | **Retry**: wait `Retry-After` seconds, resend with the same key. |
| Phase 2 | ValidationErrors about unbalanced lines | **Stop**: the minor-unit sum check was skipped or a float slipped in; fix the builder. |
| Phase 3 | Line mismatch | **Stop**: compare the request log with the fetched journal before any resend. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
