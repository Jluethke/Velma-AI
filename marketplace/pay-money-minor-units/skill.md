# Money as Integer Minor Units

**One-line description:** Audits a codebase for float money math and wrong currency exponents, then fixes conversions so every amount is stored and sent as an integer in the currency's minor unit, using the ISO 4217 exponent table plus the provider's documented special cases.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root.
- `currencies` (string[], required): ISO 4217 alphabetic codes the business charges in, for example `["USD","EUR","JPY"]`.

---

## Outputs

- `money_audit` (object[]): Each finding: file, line, pattern, classification (`float_money`, `hardcoded_100`, `display_parse`, `ok`), and fix status.
- `currency_exponents` (object): Map of currency code to `{"iso_exponent": n, "provider_notes": "..."}` for every code in `currencies`.

---

## Phase 1: Build the Exponent Table

### Entry Criteria
- `currencies` non-empty, every code three uppercase letters.

### Actions
1. For each code, take the ISO 4217 minor unit (exponent) from this reference:
   | Exponent | Currencies (ISO 4217) |
   |---|---|
   | 0 | BIF, CLP, DJF, GNF, ISK, JPY, KMF, KRW, PYG, RWF, UGX, VND, VUV, XAF, XOF, XPF |
   | 3 | BHD, IQD, JOD, KWD, LYD, OMR, TND |
   | 2 | Most others, for example USD, EUR, GBP, CAD, AUD, CHF, MXN, BRL, INR |
2. If a code is not in rows 0 or 3, confirm it is 2 by reading the ISO 4217 list (SIX publishes it as `list-one.xml`) rather than assuming.
3. Read the provider's own currency page and copy any special case into `provider_notes`. Stripe documents special handling for some currencies (its "Special cases" section covers currencies such as ISK, HUF, TWD and UGX, and three-decimal currencies). Copy the rule text exactly; do not paraphrase into a new rule.
4. Write `currency_exponents`.

### Output
`currency_exponents`.

### Quality Gate
- Every code in `currencies` has an `iso_exponent`.
- Every non-empty `provider_notes` quotes the provider doc and gives its URL.

---

## Phase 2: Find Float and Hardcoded Conversions

### Entry Criteria
- `currency_exponents` written.

### Actions
1. Run from `project_dir` and save each output:
   - Python: `rg -n "float\(.*(price|amount|total)|(price|amount|total).*\*\s*100\b|round\(.*(price|amount)" --type py`
   - JS/TS: `rg -n "(price|amount|total)[^\n]*\*\s*100\b|parseFloat\(|toFixed\(|Math\.round\(" --type js --type ts`
   - Go: `rg -n "float64|float32" --type go` then read each hit that touches an amount.
   - SQL: `rg -n -i "(price|amount|total)\s+(float|double|real)" --glob '*.sql'`
2. Classify each hit:
   | Pattern | Class | Why it breaks |
   |---|---|---|
   | Amount held in binary float (`float`, `number` from `parseFloat`, `float64`, SQL `FLOAT`) | `float_money` | `0.1 + 0.2` is not `0.3`; `19.99 * 100` evaluates to `1998.9999999999998` in IEEE 754 double |
   | `* 100` or `/ 100` applied to every currency | `hardcoded_100` | Charges JPY 100 times too much; KWD 10 times too little |
   | `toFixed` or string formatting used to compute a value sent to the API | `display_parse` | Formatting is for display only |
   | Integer minor units with a per-currency exponent | `ok` | |

### Output
Draft `money_audit`.

### Quality Gate
- Every saved search output has been read and every hit classified.
- Count of `hardcoded_100` hits is recorded.

---

## Phase 3: Fix One Conversion Path at a Time

### Entry Criteria
- Draft audit exists. The project's tests pass before you start (run them and record the command).

### Actions
1. Create one helper per language, in one file, and change call sites one file per commit:
   - Python: `from decimal import Decimal, ROUND_HALF_UP`; `def to_minor(amount: str, currency: str) -> int: exp = EXP[currency]; return int((Decimal(amount) * (Decimal(10) ** exp)).quantize(Decimal(1), rounding=ROUND_HALF_UP))`. Pass amounts as strings to `Decimal`, never `Decimal(19.99)`.
   - Node/TS: keep amounts as integer `number` within `Number.isSafeInteger`, or use `bigint`; parse user strings by splitting on the decimal point, not with `parseFloat`.
   - Go: `int64` minor units; parse strings with `strings.Cut` on ".", or a decimal library such as `github.com/shopspring/decimal`.
   - Database: `BIGINT` or `INTEGER` minor units plus a `CHAR(3)` currency column; or `NUMERIC(p,s)` if you must store major units.
2. Add a unit test per currency in `currencies`: for example `to_minor("19.99","USD") == 1999`, `to_minor("500","JPY") == 500`, `to_minor("1.234","KWD") == 1234`.
3. Rerun the full test suite after each file. Never delete or loosen an existing test to get green.
4. Update each `money_audit` row with its fix status.

### Output
Fixed code and final `money_audit`.

### Quality Gate
- The new per-currency tests run and pass (paste the test runner summary line).
- Rerunning the Phase 2 searches shows zero `float_money` and zero `hardcoded_100` hits in payment code paths, or each remaining hit has a written reason.

---

## Worked Example

Illustrative. `currencies` = `["USD","JPY"]`.

- Phase 1: `{"USD":{"iso_exponent":2,"provider_notes":""},"JPY":{"iso_exponent":0,"provider_notes":""}}`.
- Phase 2: `src/cart.ts:41: const amount = Math.round(total * 100);` classified `hardcoded_100`.
- Phase 3: replaced with `toMinor(totalString, currency)`; tests `toMinor("19.99","USD") === 1999` and `toMinor("500","JPY") === 500` pass:
```
 PASS  src/money.test.ts
 Tests: 4 passed, 4 total
```

---

## Exit Criteria

DONE when every charged currency has an exponent entry, every audit hit is classified and fixed or justified, and per-currency tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Code not in ISO 4217 | **Stop**: confirm the code with the business; never guess an exponent. |
| Phase 2 | Hundreds of hits | **Adjust**: limit to files under the payment, checkout, order and refund modules first; record the rest. |
| Phase 3 | Existing tests fail before changes | **Stop**: report; do not start fixing on a red baseline. |
| Phase 3 | Stored historical data is float | **Return**: record a data migration task; do not rewrite production data in this flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
