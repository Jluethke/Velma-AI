# Ledger QuickBooks Online Journal Sync

**One-line description:** Pushes the internal ledger's period trial balance to QuickBooks Online as summary JournalEntry objects through the QuickBooks Online Accounting API, with an account mapping table, the `requestid` parameter for safe retries, DocNumber lookup before create, and exact decimal amounts in the JSON body.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `audit_query_pack` (object, required): Output of `ledg-pg-audit-queries`. Its trial balance by account for the period is what gets synced, and all its zero-row checks must pass.
- `account_mapping` (object[], required): Rows mapping each internal account code to the QuickBooks or Xero account: internal code, target account id (QuickBooks `Account.Id`) or code (Xero `AccountCode`), and target name for review.
- `qbo_realm_id` (string, required): The QuickBooks company id (realm id) from the OAuth connection.

---

## Outputs

- `qbo_sync_job` (object): Sync state table DDL, the JournalEntry payload for each period and currency, the QuickBooks `Id` and `SyncToken` returned, the request ids used, and the verification query results.

---

## Phase 1: Prepare

### Entry Criteria
- Every zero-row check in `audit_query_pack` passed for the period. Never sync a ledger that fails its audit.
- An Intuit developer app exists with OAuth 2.0 credentials and the `com.intuit.quickbooks.accounting` scope, and a refresh token for `qbo_realm_id` is stored in a secret store.
- First runs go to the sandbox base URL `https://sandbox-quickbooks.api.intuit.com`; production is `https://quickbooks.api.intuit.com`.

### Actions
1. Confirm every internal account with a non-zero period sum has a row in `account_mapping`. List any missing account and stop.
2. Validate each mapped id exists: `GET {base}/v3/company/{realmId}/account/{id}?minorversion={mv}` returns 200 with `Account.Active` true. Use the `minorversion` value currently documented by Intuit; do not guess one.
3. Create a local sync state table: `qbo_sync(period text, currency char(3), doc_number text UNIQUE, request_id uuid, qbo_id text, sync_token text, status text, synced_at timestamptz)`.
4. Design: one summary JournalEntry per period per currency, not one per ledger entry. The ledger stays the source of truth; nobody edits these journal entries in QuickBooks.

### Output
Validated mapping and sync table.

### Quality Gate
- Missing-mapping list is empty.
- Every mapped account GET returned 200 and active.

---

## Phase 2: Build and Post the JournalEntry

### Entry Criteria
- Phase 1 passed.

### Actions
1. Build lines from the trial balance: positive sum becomes `"PostingType": "Debit"`, negative becomes `"PostingType": "Credit"` with the absolute value. Each line:
```
{"DetailType": "JournalEntryLineDetail",
 "Amount": 1234.56,
 "Description": "LEDG 2026-10 cash",
 "JournalEntryLineDetail": {"PostingType": "Debit", "AccountRef": {"value": "35"}}}
```
2. Write `Amount` from integer minor units as exact decimal text (for USD, `123456` becomes `1234.56`). In Python use a JSON encoder that writes `Decimal` as a number without float conversion (for example `simplejson.dumps(obj, use_decimal=True)`), or build the number text directly. Never `float(minor) / 100`.
3. Check debits equal credits in minor units before sending.
4. Set `DocNumber` to a deterministic value such as `LEDG-2026-10-USD` (check the field's documented maximum length) and `TxnDate` to the period end date. If the company has multicurrency on, set `CurrencyRef` and the `ExchangeRate` the user's policy specifies.
5. Before creating, query for an existing one: `GET {base}/v3/company/{realmId}/query?query=select * from JournalEntry where DocNumber = 'LEDG-2026-10-USD'&minorversion={mv}` (URL-encode the query). If found, record its `Id` and stop; do not create a duplicate.
6. Create: `POST {base}/v3/company/{realmId}/journalentry?requestid={uuid}&minorversion={mv}` with headers `Authorization: Bearer <access token>`, `Accept: application/json`, `Content-Type: application/json`. Store the `requestid` in `qbo_sync` before sending and reuse the same value on retry; Intuit uses it to return the original response instead of creating a second object.
7. Read the response: success has `JournalEntry.Id` and `JournalEntry.SyncToken`; failure has `Fault.Error[]` with `Message`, `Detail` and `code`. Store the success fields; report failures verbatim.
8. Access tokens expire; refresh with the refresh token through Intuit's OAuth token endpoint and persist the new refresh token Intuit returns.

### Output
Posted JournalEntry per period and currency.

### Quality Gate
- `qbo_sync` has one row per period and currency with `status = 'synced'` and a non-null `qbo_id`.
- The local debit total equals the credit total for each payload.

---

## Phase 3: Verify in QuickBooks

### Entry Criteria
- Posts succeeded.

### Actions
1. `GET {base}/v3/company/{realmId}/journalentry/{Id}?minorversion={mv}` and compare every line's account and amount with the payload.
2. Pull the QuickBooks Trial Balance report for the period (`GET {base}/v3/company/{realmId}/reports/TrialBalance?start_date=...&end_date=...`) and compare the mapped accounts with the ledger trial balance. Differences come from activity posted in QuickBooks outside this sync; list them.
3. Never fix a difference by editing the JournalEntry in QuickBooks. Post a correcting entry in the internal ledger and resync the next period.

### Output
`qbo_sync_job`.

### Quality Gate
- Every line in the fetched JournalEntry matches the payload amount and AccountRef.
- The trial balance comparison lists each mapped account with a difference of 0 or an explained difference.

---

## Worked Example

Illustrative only. Period 2026-10, USD, sandbox.
```
POST https://sandbox-quickbooks.api.intuit.com/v3/company/9130.../journalentry?requestid=5f0c...&minorversion=<mv>
{"DocNumber":"LEDG-2026-10-USD","TxnDate":"2026-10-31","Line":[
 {"DetailType":"JournalEntryLineDetail","Amount":18432.10,"JournalEntryLineDetail":{"PostingType":"Debit","AccountRef":{"value":"35"}}},
 {"DetailType":"JournalEntryLineDetail","Amount":18432.10,"JournalEntryLineDetail":{"PostingType":"Credit","AccountRef":{"value":"79"}}}]}
200 OK {"JournalEntry":{"Id":"146","SyncToken":"0", ...}}
```

---

## Exit Criteria

DONE when each period and currency is posted once as a balanced summary JournalEntry, the QuickBooks object matches the payload line for line, and differences against the QuickBooks trial balance are listed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Audit check failed | **Stop**: fix the ledger first. |
| Phase 2 | HTTP 401 | **Retry**: refresh the access token once, then resend with the same `requestid`. |
| Phase 2 | HTTP 429 throttling | **Retry**: back off per Intuit's documented limits and resend with the same `requestid`. |
| Phase 2 | `Fault` validation error | **Return**: report `Message` and `Detail`; do not change account ids by guessing. |
| Phase 3 | Fetched amounts differ | **Stop**: compare decimal text in the request log with the response; check the currency exponent. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
