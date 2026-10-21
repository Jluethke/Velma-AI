# Ledger Float Money Audit

**One-line description:** Finds every place an existing codebase stores, parses, computes or rounds money with binary floating point (float, double, JavaScript Number decimals, SQL real/float/money) using exact ripgrep searches per stack, and classifies each hit so later flows fix only real money paths.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root to audit.
- `stack` (string, required): One of `python`, `java`, `node`, `go`. Selects the search patterns. SQL files are searched for every stack.

---

## Outputs

- `float_money_findings` (object[]): One row per hit: file, line, matched text, classification (`money`, `not_money`, `unknown`), money flow it belongs to (price, balance, fee, tax, fx rate, display only), and the fix category (`type_change`, `parse_change`, `rounding_change`, `schema_change`, `display_only`). `unknown` rows carry the question that would resolve them.

---

## Phase 1: Run the Searches

### Entry Criteria
- `repo_path` exists and is readable.
- `rg` (ripgrep) is installed: `rg --version` prints a version line. If not, install it from the official ripgrep releases or the OS package manager before continuing.
- `stack` is one of the four allowed values.

### Actions
1. Change into `repo_path`. Run `git status --short` if it is a git repo and record whether the tree is clean. This flow never edits files.
2. Run the stack search from this table and save the output to a scratch file outside the repo (for example `$TMPDIR/float_hits.txt`). Use `rg -n` so every hit has a line number.

| `stack` | Command |
|---|---|
| python | `rg -n --type py -e 'float\(' -e ':\s*float\b' -e '->\s*float\b' -e 'FloatField' -e 'Float\(' -e '\bround\(' -e 'Decimal\([0-9]*\.[0-9]'` |
| java | `rg -n --type java -e '\bdouble\b' -e '\bfloat\b' -e '\bDouble\.' -e 'doubleValue\(\)' -e 'new BigDecimal\(\s*-?[0-9]+\.[0-9]' -e 'ROUND_HALF'` |
| node | `rg -n --type js --type ts -e 'parseFloat' -e 'toFixed\(' -e 'Math\.round' -e 'Number\(' -e '\*\s*100\b' -e '/\s*100\b'` |
| go | `rg -n --type go -e '\bfloat64\b' -e '\bfloat32\b' -e 'ParseFloat' -e 'NewFromFloat' -e 'math\.Round'` |

3. Run the SQL search for every stack: `rg -n -i --glob '*.sql' --glob '*migration*' -e '\breal\b' -e 'double precision' -e '\bfloat[48]?\b' -e '\bmoney\b'`.
4. Run the ORM column search for the stack: python `rg -n -e 'FloatField' -e 'Column\(Float'`; java `rg -n -e '@Column' -A2 --type java` and read the field type under each; node `rg -n -e 'DataTypes\.FLOAT' -e 'DataTypes\.DOUBLE' -e "type:\s*'float'"`; go `rg -n -e 'gorm:"type:(float|double|real)'`.
5. Count hits per command with `rg -c` and record the totals. If a command prints more than you can classify in one pass, split by directory with `rg -n ... src/billing` and so on; never drop a directory from the sweep.

### Output
Raw hit list with per-command totals.

### Quality Gate
- Each command in the table for the chosen `stack` and the SQL command were run, and each has a recorded total (zero counts are recorded as 0).
- `git status --short` output is unchanged from step 1 (no files edited).

---

## Phase 2: Classify Each Hit

### Entry Criteria
- Raw hit list exists.

### Actions
1. For each hit, open the file at the line and read at least 10 lines around it. Do not classify from the grep line alone.
2. Classify with this decision table:

| Condition | Classification |
|---|---|
| Variable, field or column name or its callers carry price, amount, total, balance, fee, tax, cost, refund, payout, charge, rate | `money` |
| Value is a duration, coordinate, percentage of CPU, score, ML weight, or other non-currency quantity | `not_money` |
| Value is an FX rate or a tax rate stored as float | `money` (rates feed money math) |
| Value is only formatted for display after exact math elsewhere | `money` with fix category `display_only` |
| You cannot trace the value to a source or sink in 3 hops of callers | `unknown`, and write the question |

3. Assign the fix category: float type on a money variable or field = `type_change`; `parseFloat`, `float()`, `ParseFloat` on money input = `parse_change`; `round`, `toFixed`, `Math.round`, `ROUND_HALF_*` on money = `rounding_change`; SQL column = `schema_change`.
4. For each `money` hit, write the concrete failure it causes, for example "0.1 + 0.2 sums to 0.30000000000000004" or "`(1.005).toFixed(2)` returns `1.00`" or "PostgreSQL `money` output depends on `lc_monetary`".

### Output
`float_money_findings`.

### Quality Gate
- Every hit from Phase 1 has exactly one classification; the count of classified rows equals the Phase 1 total.
- Every `unknown` row has a written question.
- Every `money` row has a fix category.

---

## Worked Example

Illustrative only. `stack` = node, `repo_path` = `/srv/shop`.

Phase 1:
```
$ rg -n --type ts -e 'parseFloat' -e 'toFixed\(' src
src/cart/total.ts:14:  const subtotal = items.reduce((s, i) => s + parseFloat(i.price), 0);
src/cart/total.ts:22:  return subtotal.toFixed(2);
src/metrics/latency.ts:8:  const p95 = parseFloat(raw);
$ rg -n -i --glob '*.sql' -e '\bmoney\b' -e 'double precision'
db/migrations/0003_orders.sql:5:  total double precision NOT NULL,
```
Phase 2 produces four rows: `total.ts:14` money/parse_change, `total.ts:22` money/rounding_change, `latency.ts:8` not_money, `0003_orders.sql:5` money/schema_change.

---

## Exit Criteria

DONE when every search for the chosen `stack` plus the SQL search ran, every hit is classified, and `float_money_findings` lists the money hits with fix categories. No source file was changed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rg` not installed | **Stop**: install ripgrep; do not substitute a hand-written file walk that may skip files. |
| Phase 1 | `stack` not one of the four values | **Return**: ask the user which stack the money code is written in. |
| Phase 1 | Repository mixes stacks | **Adjust**: run the table row for every stack present and merge the hits. |
| Phase 2 | Hit cannot be traced | **Adjust**: classify `unknown` with a question; do not guess `not_money`. |
| Phase 2 | Tempted to fix code during the audit | **Stop**: this flow only reports; fixes belong to the stack money flow. |

---

## Reference Section

### Why float fails for money
IEEE 754 binary64 cannot represent most decimal fractions exactly (0.1 is stored as 0.1000000000000000055511151231257827...). Sums drift, equality checks fail, and rounding at a half cent goes the wrong way because the stored value is slightly below or above the half.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
