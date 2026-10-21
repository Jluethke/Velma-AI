# Ledger Rounding Policy

**One-line description:** Writes the rounding policy for a money system: which rounding mode (half-even or half-up, defined precisely for negatives) applies at which named boundary (line, invoice, tax, conversion, allocation), maps each mode to the exact constant in Python, Java, JavaScript, Go and PostgreSQL, and proves the mapping with tie-value tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `money_representation_spec` (object, required): Output of `ledg-money-representation-decision`.
- `rounding_requirements` (object, optional): Written rules from the tax authority, contract, card network or accounting policy that dictate a rounding mode or a rounding level (per line or per invoice). Each rule names its source document.

---

## Outputs

- `rounding_policy` (object): A list of rounding points, each with: name, where in the code it runs, input scale, output scale, mode, the source of the mode (a rule in `rounding_requirements` or "engineering default, user confirmed"), and the per-language constant. Plus the tie-value test table.

---

## Phase 1: List the Rounding Points

### Entry Criteria
- `money_representation_spec` is present.

### Actions
1. Search the code for every place a value of higher scale becomes minor units: `rg -n -e quantize -e setScale -e RoundBank -e 'Round\(' -e 'round\(' -e 'Math\.round' -e 'toFixed'` plus any SQL `round(`.
2. Name each point using this list and add any others found: `line_amount` (quantity times unit price), `line_tax`, `invoice_tax`, `discount`, `fx_conversion`, `interest_accrual`, `fee_percentage`, `allocation_split`.
3. Rule: round once, at the named point, and never round an intermediate value that feeds another calculation. Record every place the code rounds twice in a row (for example rounding a line and then rounding the sum of rounded lines again) as a defect.
4. For tax, ask which level applies (per line or per invoice total) and record the source. The two levels give different totals; the choice is a legal or contractual one, not an engineering one.

### Output
Rounding point list with defects.

### Quality Gate
- Every hit from the search maps to a named point or a defect.
- Every tax point has a level with a source, or is listed as an open question.

---

## Phase 2: Assign Modes and Constants

### Entry Criteria
- Rounding point list exists.

### Actions
1. For each point, take the mode from `rounding_requirements` if a rule covers it. If no rule covers it, propose half-even (banker's rounding, the IEEE 754 default rounding-direction attribute for results) for internal computations such as interest and fx, and mark it "user must confirm".
2. Define modes precisely. Half-up is ambiguous for negatives; use these names:

| Name | 2.5 | -2.5 | 2.4 | -2.6 |
|---|---|---|---|---|
| half-even | 2 | -2 | 2 | -3 |
| half-away-from-zero | 3 | -3 | 2 | -3 |
| half-toward-positive-infinity | 3 | -2 | 2 | -3 |

3. Map each mode to the language constant:

| Mode | Python `decimal` | Java `RoundingMode` | Go shopspring | JavaScript | PostgreSQL |
|---|---|---|---|---|---|
| half-even | `ROUND_HALF_EVEN` (also the default context rounding) | `HALF_EVEN` | `RoundBank` | write it; no built-in for decimals | no built-in for `numeric`; write a function |
| half-away-from-zero | `ROUND_HALF_UP` | `HALF_UP` | `Round` | write it; `Math.round` is not this | `round(numeric, s)` |
| half-toward-positive-infinity | no constant; compose | no constant | no constant | `Math.round` on integers only | no built-in |

Python's built-in `round()` on floats uses half-even on the binary value, so `round(2.675, 2)` gives `2.67`; it is not used for money. PostgreSQL `round(double precision)` follows the platform, typically half-even; `round(numeric)` rounds ties away from zero.
4. For integer-only code paths (rounding a rational `num/den` to an integer), write the rule with integer division and remainder, handling sign explicitly. Example for half-even with `den > 0`: `q, r = divmod(num, den)` in Python (floor division), then compare `2*r` with `den`: greater rounds up, equal rounds to the even of `q` and `q+1`, less keeps `q`.

### Output
Mode and constant per rounding point.

### Quality Gate
- Every point has a mode with a source or a "user must confirm" flag.
- No point maps to `Math.round`, Python `round()` on float, or `toFixed`.

---

## Phase 3: Prove the Mapping

### Entry Criteria
- Constants are assigned.

### Actions
1. For each language in use, write a test that feeds the tie table from Phase 2 (2.5, -2.5, 2.4, -2.6 at scale 0, and 0.125, -0.125 at scale 2) through the exact constant and asserts the table values.
2. Run it: `pytest -q -k rounding`, `./mvnw -q -Dtest='*Rounding*' test`, `go test -run Rounding ./...`, or `npx vitest run rounding`.
3. If PostgreSQL rounds in SQL, run `psql -c "select round(2.5::numeric), round(-2.5::numeric), round(0.125::numeric, 2)"` and compare with the table (expected `3`, `-3`, `0.13`).
4. Write `rounding_policy` as JSON.

### Output
`rounding_policy`.

### Quality Gate
- Each language test passes and covers every row of the tie table.
- The psql check output matches the half-away-from-zero row when SQL rounding is in use.

---

## Worked Example

Illustrative only. Invoice of 3 lines at 7.25% sales tax, `rounding_requirements` says tax is computed on the invoice total, half-away-from-zero (source: the user's state tax guidance document).
Phase 1: points `line_amount`, `invoice_tax`; defect at `cart.py:40` rounds each line's tax then rounds the sum.
Phase 2: `invoice_tax` uses Python `ROUND_HALF_UP`; `line_amount` has no rule, proposed half-even, flagged.
Phase 3:
```
$ python -c "from decimal import *; print(Decimal('0.125').quantize(Decimal('0.01'), ROUND_HALF_UP), Decimal('0.125').quantize(Decimal('0.01'), ROUND_HALF_EVEN))"
0.13 0.12
$ pytest -q -k rounding
6 passed
```

---

## Exit Criteria

DONE when every rounding point is named, has exactly one mode with a source or flag, maps to a real language constant, and the tie-value tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tax level unknown | **Return**: list it as an open question for the user's tax advisor; do not choose. |
| Phase 1 | Double rounding found | **Adjust**: record it as a defect for the stack money flow to fix. |
| Phase 2 | Requirement names a mode with no language constant | **Adjust**: implement it with integer division and add it to the tie tests. |
| Phase 3 | Tie test fails | **Stop**: the constant is wrong for that mode; fix the mapping, not the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
