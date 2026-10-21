# Ledger FX Rate Conversion

**One-line description:** Records currency conversions in a double-entry ledger with a stored rate (source, quote direction, observed time, fetched time), per-currency clearing accounts so each currency balances on its own, one explicit rounding point, and a staleness rule that refuses old rates.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ledger_schema` (object, required): Output of `ledg-pg-double-entry-schema`.
- `rounding_policy` (object, required): Output of `ledg-rounding-policy`; must contain an `fx_conversion` point.
- `rate_source` (object, required): Where rates come from: provider name, endpoint or file, the published quote convention (for example "1 EUR = x USD"), publication schedule from the provider's docs, and the maximum rate age the business accepts (a user input).

---

## Outputs

- `fx_conversion_spec` (object): `fx_rates` DDL, the rate fetch job, the conversion posting template, the rounding call, the staleness rule, and test results.

---

## Phase 1: Store Rates

### Entry Criteria
- `rate_source` names a provider and its quote convention.

### Actions
1. Create the rate table:
```
CREATE TABLE fx_rates (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  base         char(3) NOT NULL,
  quote        char(3) NOT NULL,
  rate         numeric NOT NULL CHECK (rate > 0),
  source       text NOT NULL,
  observed_at  timestamptz NOT NULL,
  fetched_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (base, quote, source, observed_at)
);
```
`rate` means: 1 unit of `base` = `rate` units of `quote`. Store exactly the digits the provider published (unconstrained `numeric` keeps them); never round on ingest and never store as float.
2. Write the fetch job for the provider. Example: the European Central Bank publishes euro reference rates as XML at `https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml`; each `<Cube currency="USD" rate="..."/>` means 1 EUR = rate USD, and the parent `<Cube time="YYYY-MM-DD">` is the observation date. Parse the `rate` attribute as a string into the decimal type.
3. Insert with `ON CONFLICT (base, quote, source, observed_at) DO NOTHING` so reruns are safe.
4. Do not compute an inverse as `1/rate` and store it as if published. If the ledger needs USD to EUR and the source publishes EUR to USD, convert by dividing by the stored rate at conversion time, with the rounding from the policy, and record that the inverse was used.

### Output
Rate table and fetch job.

### Quality Gate
- After one fetch, `SELECT count(*) FROM fx_rates WHERE source = '<source>'` is greater than 0 and a second run adds 0 rows.
- `SELECT pg_typeof(rate) FROM fx_rates LIMIT 1` returns `numeric`.

---

## Phase 2: Post a Conversion

### Entry Criteria
- Rates exist; `ledger_schema` has clearing accounts per currency (for example `fx_clearing_usd`, `fx_clearing_eur`). Create them if missing.

### Actions
1. Select the rate valid for the transaction:
```
SELECT id, rate, observed_at FROM fx_rates
WHERE base = $1 AND quote = $2 AND source = $3 AND observed_at <= $4
ORDER BY observed_at DESC LIMIT 1;
```
2. Staleness rule: if `$4 - observed_at` exceeds the maximum age in `rate_source`, refuse the conversion with an error naming the rate id and its age. Do not fall back to an older rate silently.
3. Compute the target amount: `target_minor = round_policy(source_minor * rate * 10^(exp_target - exp_source))` using the `fx_conversion` mode from `rounding_policy`. Round exactly once.
4. Post one journal entry with four postings, each currency summing to zero:

| Account | Currency | amount_minor |
|---|---|---|
| customer_usd (source funds leave) | USD | -source_minor |
| fx_clearing_usd | USD | +source_minor |
| fx_clearing_eur | EUR | -target_minor |
| merchant_eur (target funds arrive) | EUR | +target_minor |

5. Record the `fx_rates.id` used and the computed unrounded product on the journal entry (for example in a JSON `metadata` column or a side table `entry_fx(entry_id, rate_id, unrounded)`), so the conversion can be replayed.
6. Clearing account balances accumulate the open position; revaluation and realized gain or loss postings follow the user's accounting policy and are out of scope here.

### Output
Conversion posting code.

### Quality Gate
- The posted entry passes the balance trigger (commits).
- The entry links to exactly one `fx_rates.id`.

---

## Phase 3: Test

### Entry Criteria
- Posting code compiles.

### Actions
1. Test a known case with a fixed rate row: 100.00 USD to EUR at an inserted rate; assert `target_minor` equals the value computed by hand with the policy's mode.
2. Test a tie case where the unrounded product ends in exactly half a minor unit; assert the policy's mode is applied.
3. Test staleness: a rate older than the maximum age is refused.
4. Test a zero-exponent target (JPY) and a three-exponent target (KWD) so the `10^(exp_target - exp_source)` factor is exercised.
5. Run the stack test command and record the summary.

### Output
`fx_conversion_spec`.

### Quality Gate
- All four tests pass.
- `SELECT currency, sum(amount_minor) FROM postings GROUP BY currency` returns 0 for every currency after the tests.

---

## Worked Example

Illustrative only. ECB rate row: base EUR, quote USD, rate 1.0832, observed 2026-10-20. Convert 50000 USD cents to EUR (inverse use).
Phase 2: unrounded = 50000 / 1.0832 = 46159.527... EUR cents; half-even gives 46160. Postings: customer_usd -50000 USD, fx_clearing_usd +50000 USD, fx_clearing_eur -46160 EUR, merchant_eur +46160 EUR. Entry metadata `{"rate_id": 912, "inverse": true, "unrounded": "46159.527..."}`.
```
$ pytest -q -k fx
4 passed
```

---

## Exit Criteria

DONE when rates are stored as published with source and time, conversions use a non-stale rate, round once per policy, post four balanced postings through clearing accounts, and link the rate used.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Provider changes format or URL | **Stop**: the fetch job fails loudly; fix the parser before any conversion runs. |
| Phase 1 | Provider has no rate for a pair | **Adjust**: cross through a published base (for example via EUR), record both rate ids, round once at the end. |
| Phase 2 | No non-stale rate | **Return**: refuse the conversion and report the age; do not use an older rate. |
| Phase 3 | Hand calculation disagrees | **Stop**: check the exponent factor and the direction of the quote before changing code. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
