# Port Float Format and Rounding Audit

**One-line description:** Finds every place the source turns a floating-point value into text or rounds it, measures how the source and target languages print and round the same doubles with a probe program in each language, and records the exact target formatting and rounding call that reproduces the source's characters.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the source repository at the reference commit.
- `stack` (string, required): Port pair (`py-ts`, `py-go`, `js-ts`, `java-kotlin`, `c-rust`).
- `behavior_inventory` (object[], required): Output of `port-behavior-surface-inventory`.

---

## Outputs

- `float_findings` (object[]): One row per site: `id` (F-001 style), `location`, `source_call` (for example `f"{x:.2f}"`, `repr(x)`, `round(x, 2)`), `target_call`, `differs_on` (probe values whose output differs before the fix), `behaviors` (B-ids), plus a `probe_table` with the measured outputs of both languages.

---

## Phase 1: Probe Both Runtimes

### Entry Criteria
- Source and target toolchains are installed at the versions recorded in `behavior_inventory`.

### Actions
1. Use this fixed probe list (each value chosen because a known formatting or rounding rule changes at it): `0.0, -0.0, 0.1, 0.1+0.2, 1.0, 2.5, -2.5, 0.5, 1.5, 2.675, 1.005, 1e15, 1e16, 1e21, 1e-5, 1e-7, 123456789.0, 5e-324, 1.7976931348623157e308, inf, -inf, nan`.
2. Write a probe program in the source language that prints, for each value on one line: the default string conversion, the JSON encoding, two-decimal formatting, and integer rounding. Use these calls:

| Language | Default text | JSON | Two decimals | Round to integer |
|---|---|---|---|---|
| Python | `repr(x)` and `str(x)` | `json.dumps(x)` | `f"{x:.2f}"` | `round(x)` |
| JavaScript / TS | `String(x)` | `JSON.stringify(x)` | `x.toFixed(2)` | `Math.round(x)` |
| Go | `fmt.Sprint(x)` and `strconv.FormatFloat(x, 'g', -1, 64)` | `json.Marshal(x)` | `fmt.Sprintf("%.2f", x)` | `math.Round(x)` and `math.RoundToEven(x)` |
| Java / Kotlin | `Double.toString(x)` / `x.toString()` | Jackson `writeValueAsString(x)` | `String.format(Locale.ROOT, "%.2f", x)` | `Math.round(x)` and `Math.rint(x)` |
| C | `printf("%g", x)` and `printf("%.17g", x)` | n/a | `printf("%.2f", x)` | `round(x)` and `rint(x)` |
| Rust | `format!("{}", x)` and `format!("{:?}", x)` | `serde_json::to_string(&x)` | `format!("{:.2}", x)` | `x.round()` and `x.round_ties_even()` (Rust 1.77+) |

3. Write the same probe in the target language. Run both with `LC_ALL=C.UTF-8` and save outputs as `probe_source.txt` and `probe_target.txt`.
4. Run `diff probe_source.txt probe_target.txt` and keep the output. Expected differences to look for (verify each against your probe, do not assume):
   - Integral values: Python prints `1.0`, JavaScript `1`, Go `fmt.Sprint` `1`, Java `1.0`, Rust `{}` `1` and `{:?}` `1.0`.
   - Exponent switch: Python `repr` switches at 1e16 (`1e+16`) and below 1e-4 (`1e-05`); JavaScript at 1e21 and below 1e-6; Java at 1e7 (`1.0E7`) and below 1e-3; Rust `{}` never uses an exponent.
   - Negative zero: `String(-0)` and `JSON.stringify(-0)` print `0` in JavaScript; Python prints `-0.0`.
   - NaN and infinity: Python `json.dumps` writes `NaN` and `Infinity`; `JSON.stringify` writes `null`; Go `json.Marshal` returns an error; serde_json writes `null`.
   - Rounding: Python `round(2.5)` is `2` (half to even); `Math.round(2.5)` is `3` and `Math.round(-2.5)` is `-2` (half toward positive infinity); Go `math.Round` and Rust `round` are half away from zero; Java `Math.round(-2.5)` is `-2`.
   - Decimal places: `f"{2.675:.2f}"` is `2.67` because the double is below 2.675; `(1.005).toFixed(2)` is `1.00` for the same reason; Java `String.format` uses HALF_UP on the exact binary value. Compare actual output; do not reason it out.

### Output
`probe_table` with both outputs side by side.

### Quality Gate
- Both probe files exist and have one line per probe value.
- The `diff` output is attached verbatim.

---

## Phase 2: Find the Sites

### Entry Criteria
- `probe_table` exists.

### Actions
1. Grep the source for float-to-text and rounding:
   - Python: `rg -n "f\".*\{[^}]*:[^}]*[fgeG%]\}|%[0-9.]*[fgeG]|\.format\(|round\(|repr\(|str\(.*\)|json\.dumps|Decimal\(" --type py`
   - JavaScript: `rg -n "toFixed|toPrecision|toExponential|String\(|\`\$\{|Math\.round|JSON\.stringify|toLocaleString" --type js`
   - Java: `rg -n "String\.format|Double\.toString|String\.valueOf|\+ *\"|DecimalFormat|Math\.(round|rint)|BigDecimal" --type java`
   - C: `rg -n "printf\(.*%[0-9.*]*[fgeEaA]|round\(|rint\(|lround\(|strtod" --type c`
2. Keep only sites whose value reaches an in-scope behavior's output (stdout, file, JSON, return value compared by callers).
3. Also grep for floating summation order and fused multiply-add risks: Go allows the compiler to fuse `x*y + z` into one FMA instruction on some architectures (arm64, ppc64le, s390x); an explicit conversion `float64(x*y) + z` prevents fusion. GCC defaults to `-ffp-contract=fast` outside ISO C mode, so the C source may already be fused. Record every `a*b + c` on a value that reaches output.

### Output
Site list.

### Quality Gate
- Every grep hit is either kept with its B-id or dropped with "does not reach output".
- For Go targets and C sources, every `*` followed by `+` on floats in kept sites is listed.

---

## Phase 3: Choose the Target Call

### Entry Criteria
- Site list exists.

### Actions
1. For each site, choose the target call from this table, then confirm by adding the site's real values to the probe and rerunning `diff`.

| Source call | TypeScript | Go | Kotlin | Rust |
|---|---|---|---|---|
| Python `repr(x)` / `str(x)` | helper `pyRepr` reproducing CPython's rule: take the shortest digits (`x.toExponential()` gives them), use exponent form when the decimal exponent is at least 16 or below -4, write the exponent with a sign and at least two digits (`1e+16`, `1e-05`), and append `.0` to integral values in fixed form. JS `String(x)` alone is wrong for 1e16 to 1e21 (prints all digits) and for 1e-5, 1e-6 | `strconv.FormatFloat(x, 'e', -1, 64)` gives the shortest digits; apply the same rule | `x.toString()` switches to exponent at 1e7; build the same helper on `BigDecimal(x.toString())` digits | `format!("{:e}", x)` gives the shortest digits; apply the same rule |
| Python `f"{x:.Nf}"` | `x.toFixed(N)` only where the probe shows identical output; otherwise a half-even helper on the decimal string | `strconv.FormatFloat(x, 'f', N, 64)` | `String.format(Locale.ROOT, "%.Nf", x)` (HALF_UP: check probe) or `BigDecimal(x).setScale(N, RoundingMode.HALF_EVEN)` | `format!("{:.N$}", x, N = n)` |
| Python `round(x)` (half to even) | helper `roundHalfEven` | `math.RoundToEven(x)` | `Math.rint(x)` | `x.round_ties_even()` |
| Python `round(x, n)` | port CPython's algorithm only if values matter to the last digit; otherwise format with `.nf` and parse | same | `BigDecimal(x.toString()).setScale(n, RoundingMode.HALF_EVEN)` differs from CPython for some inputs; verify in probe | same |
| `Decimal` or `BigDecimal` arithmetic | `decimal.js` with the same precision and rounding mode | `shopspring/decimal` | `BigDecimal` with the same `MathContext` | `rust_decimal` |
| JSON number output | write the number through the same formatting helper | `json.Marshal` uses `strconv` 'f' or 'e' like ES6; check probe | configure Jackson features; check probe | `serde_json` plus `ryu` output; check probe |
| C `printf("%g")` | helper reproducing 6 significant digits, trailing zeros removed | `fmt.Sprintf("%g", x)` uses shortest digits, not 6; use `strconv.FormatFloat(x, 'g', 6, 64)` then trim | `String.format("%g")` keeps trailing zeros; helper | no `%g` in `format!`; helper |

2. For transcendental functions (`sin`, `exp`, `log`, `pow`) the last bit can differ between libm implementations (Go has its own pure-Go math package, V8 uses an fdlibm port). If such a value is printed with full precision, record the site as needing a tolerance in the corpus schema. The tolerance in ULPs is a user decision; record it as an open question, never pick a number.
3. Rerun the probe with each site's helper and attach the empty `diff`.

### Output
`float_findings`.

### Quality Gate
- `diff` of source probe versus target probe, after applying the chosen calls, is empty for every kept site, or the remaining lines are listed as open questions.
- No finding says "close enough".

---

## Worked Example

Illustrative. `stack=py-ts`, source prints `f"total={total}"` and `json.dumps({"ratio": r})`.

Phase 1 diff excerpt:
```
$ diff probe_source.txt probe_target.txt
< 1.0 | 1.0 | 1.00 | 1
> 1 | 1 | 1.00 | 1
< 2.5 | 2.5 | 2.50 | 2
> 2.5 | 2.5 | 2.50 | 3
< nan | NaN | nan | ValueError
> NaN | null | NaN | NaN
```
Phase 3 rows:
```
F-001 report.py:40 f"total={total}" -> `total=${pyRepr(total)}`  differs_on: 1.0, 1e16, 1e-5
F-002 report.py:52 json.dumps ratio -> custom replacer; source never emits NaN (ratio guarded at line 49), so only 1.0 vs 1 matters
```
After helper: `diff probe_source.txt probe_target.txt` prints nothing.

---

## Exit Criteria

DONE when every float-to-text and rounding site that reaches output has a target call whose probe output matches the source, or an open question naming the value and the needed tolerance.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Probe outputs differ across machines | **Adjust**: rerun with `LC_ALL=C.UTF-8`; locale changes the decimal separator in C `printf` and Java `String.format` without `Locale.ROOT`. |
| Phase 1 | Java version below 19 | **Adjust**: record it; `Double.toString` output for some values changed in JDK 19, so capture on the version production runs. |
| Phase 3 | No target call reproduces the source digits | **Adjust**: write a helper and test it against the full probe list; keep it in one file. |
| Phase 3 | Last-ulp difference in a transcendental function | **Return**: to the user with the value pair; the tolerance is their call. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
