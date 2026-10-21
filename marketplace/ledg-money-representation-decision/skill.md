# Ledger Money Representation Decision

**One-line description:** Decides, per currency and per value kind, whether money is stored as integer minor units or as a fixed-scale decimal, takes each currency exponent from the ISO 4217 list, and writes the representation spec every later flow reads.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `stack` (string, required): One of `python`, `java`, `node`, `go`.
- `currencies` (string[], required): ISO 4217 alphabetic codes the system handles, for example `["USD","EUR","JPY","KWD"]`.
- `float_money_findings` (object[], required): Output of `ledg-float-money-audit`. Used to list what must migrate.

---

## Outputs

- `money_representation_spec` (object): For each currency: alphabetic code, numeric code, minor unit exponent and its source. For each value kind (posted amount, unit price, rate, tax rate, interest accrual): storage type, scale, language type, database column type, JSON wire format. Plus the integer range limits that apply and a migration list from `float_money_findings`.

---

## Phase 1: Fix Currency Exponents

### Entry Criteria
- `currencies` is non-empty and every entry is three uppercase letters.

### Actions
1. Download the ISO 4217 list one from the maintenance agency (SIX): the current file is linked from the ISO 4217 page at six-group.com as `list-one.xml`. Record the download date and the `Pblshd` date attribute in the file.
2. For each code in `currencies`, read the `CcyMnrUnts` element. That integer is the minor unit exponent (USD 2, JPY 0, KWD 3). If the value is `N.A.`, the code is not a cash currency (for example XAU); mark it for decimal storage and flag it.
3. If a payment processor is in scope, open its currency documentation and compare. Stripe, for example, documents a zero-decimal currency list and special cases where its smallest unit differs from ISO for some currencies. Record every difference as a row: currency, ISO exponent, processor exponent, doc URL.
4. Never hardcode a two-decimal assumption. Every exponent in the spec cites list one or the processor doc.

### Output
Currency exponent table with sources.

### Quality Gate
- Every code in `currencies` has an exponent with a source, or a flag.
- Every ISO versus processor difference is listed with a URL.

---

## Phase 2: Choose a Representation per Value Kind

### Entry Criteria
- Exponent table exists.

### Actions
1. Apply this decision table to each value kind:

| Value kind | Representation | Why |
|---|---|---|
| Amount posted to the ledger (charge, refund, fee, transfer) | Integer minor units, signed 64-bit (`bigint` column) | Postings must sum exactly to zero; integers add exactly. |
| Unit price that can be below one minor unit (per-request pricing, fuel per liter) | Decimal with scale from the user's pricing spec | Rounded to minor units only when posted. |
| FX rate, tax rate, interest rate | Decimal, scale from the rate source (Phase 1 of `ledg-fx-rate-conversion`) | Rates are not money; never store as float. |
| Display string | Derived at render time with the locale formatter | Never parsed back. |

2. Fill the per-stack types from this table:

| `stack` | Integer minor units | Decimal | JSON wire |
|---|---|---|---|
| python | `int` | `decimal.Decimal` | string, for example `"1234"` or `"12.34"` |
| java | `long` with `Math.addExact` | `java.math.BigDecimal` | string |
| node | `number` while `Number.isSafeInteger`, else `bigint` | dinero.js or string decimal | string |
| go | `int64` with overflow checks | `github.com/shopspring/decimal` `Decimal` | string |

3. Record range limits: PostgreSQL `bigint` and Java `long` and Go `int64` max is 9223372036854775807; JavaScript `Number.MAX_SAFE_INTEGER` is 9007199254740991. For each currency, compute the largest whole-currency amount each limit allows (limit divided by 10 to the exponent) and record it.
4. Choose the JSON wire format as a string for both kinds. JSON numbers pass through binary doubles in many parsers.
5. Choose database column types: `bigint` for minor units, `numeric(p, s)` for decimals with p and s from the user's pricing spec or rate source. Never the PostgreSQL `money` type (its text form depends on `lc_monetary`) and never `real` or `double precision`.

### Output
Draft `money_representation_spec`.

### Quality Gate
- Every value kind has storage type, language type, column type and wire format filled.
- No row names a float or `money` type.
- Every decimal scale cites the user spec or rate source, or is listed as an open question.

---

## Phase 3: Attach the Migration List

### Entry Criteria
- Draft spec exists.

### Actions
1. For each `money` row in `float_money_findings`, add a migration item: file and line, current type, target type from the spec, and the flow that will make the change (`ledg-py-decimal-money`, `ledg-java-bigdecimal-money`, `ledg-node-integer-cents-money`, `ledg-go-integer-cents-money`, or `ledg-pg-double-entry-schema` for SQL).
2. For each `schema_change`, note that existing float data must be converted with an explicit rounding rule from `ledg-rounding-policy`, and that the old column is kept until the new one is verified.
3. Write `money_representation_spec` as JSON.

### Output
`money_representation_spec`.

### Quality Gate
- The count of migration items equals the count of `money` rows in `float_money_findings`.
- The spec parses with `python -m json.tool` (or `jq .`) without error.

---

## Worked Example

Illustrative only. `stack` = go, `currencies` = `["USD","JPY","KWD"]`.

Phase 1: list one gives USD 2, JPY 0, KWD 3.
Phase 2: posted amounts are `int64` minor units; a metered price of USD 0.00042 per call is `decimal.Decimal` with scale 5 from the price sheet. USD limit: 9223372036854775807 / 100 = 92233720368547758 dollars.
Phase 3 spec fragment:
```
{"currencies":[{"code":"KWD","exponent":3,"source":"ISO 4217 list one, Pblshd 2026-01-01"}],
 "kinds":{"posted_amount":{"go":"int64","column":"bigint","wire":"string"}}}
```

---

## Exit Criteria

DONE when every currency has a sourced exponent, every value kind has a non-float representation per the `stack`, and every float money finding has a migration item.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Code not found in list one | **Return**: ask the user to confirm the code; it may be withdrawn (list three) or a typo. |
| Phase 1 | Processor exponent differs from ISO | **Adjust**: store ISO exponent in the ledger and convert at the processor boundary; record the rule. |
| Phase 2 | User needs sub-minor-unit precision for posted amounts | **Adjust**: post in minor units and keep the unrounded decimal on a separate accrual account, documented. |
| Phase 2 | Scale for a decimal kind unknown | **Return**: list it as an open question; do not pick a scale. |
| Phase 3 | Migration count mismatch | **Retry**: re-read `float_money_findings` and add the missing items. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
