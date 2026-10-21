# Port Integer Semantics Audit

**One-line description:** Finds every integer operation in the source whose result differs between the source and target language (overflow, floor versus truncating division, modulo sign, shift width, integer parsing, JavaScript's 2^53 limit, C undefined behavior) and records the exact target construct and the boundary inputs that prove it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the source repository at the reference commit.
- `stack` (string, required): Port pair (`py-ts`, `py-go`, `js-ts`, `java-kotlin`, `c-rust`).
- `behavior_inventory` (object[], required): Output of `port-behavior-surface-inventory`; findings are tied to B-ids.

---

## Outputs

- `integer_findings` (object[]): One row per risky site: `id` (I-001 style), `location`, `operation`, `source_semantics`, `target_semantics`, `target_construct` (the exact replacement), `boundary_inputs` (values that expose the difference), `behaviors` (B-ids).

---

## Phase 1: Load the Semantics Table

### Entry Criteria
- `stack` is one of the five allowed values.

### Actions
1. Read the rows for both languages in the pair. These are language definitions, not opinions.

| Operation | Python | JavaScript / TypeScript `number` | Go | Java / Kotlin | C | Rust |
|---|---|---|---|---|---|---|
| Integer range | unbounded | exact only within +/-(2^53 - 1) (`Number.MAX_SAFE_INTEGER`); `bigint` is unbounded | `int` is 64 bits on 64-bit platforms; sized types `int32`, `int64` | `Int` 32, `Long` 64 bits | `int` width is implementation-defined (check `__SIZEOF_INT__`); `long` is 64 bits on LP64 Linux and macOS, 32 bits on 64-bit Windows | fixed by type |
| Overflow on `+ - *` | never | rounds to nearest double, silently | wraps (two's complement), silently | wraps silently; `Math.addExact` and friends throw `ArithmeticException` | signed: undefined behavior; unsigned: wraps modulo 2^N | debug build: panics "attempt to add with overflow"; release build: wraps unless `overflow-checks = true` in the profile |
| `a / b` for negative operands | `//` floors: `-7 // 2 == -4` | `/` is float division; `Math.trunc(-7/2) == -3`; `bigint` `/` truncates: `-7n / 2n == -3n` | truncates: `-7 / 2 == -3` | truncates: `-7 / 2 == -3`; `Math.floorDiv` floors; Kotlin `floorDiv` (1.5+) floors | truncates (C99 and later) | truncates; `div_euclid` gives a non-negative remainder (differs from Python when the divisor is negative) |
| `a % b` sign | sign of divisor: `-7 % 2 == 1` | sign of dividend: `-7 % 2 == -1` | sign of dividend | sign of dividend; `Math.floorMod` and Kotlin `mod` follow the divisor | sign of dividend | sign of dividend; `rem_euclid` is never negative |
| Divide by zero | `ZeroDivisionError` | `number`: `Infinity` or `NaN`; `bigint`: `RangeError` | runtime panic "integer divide by zero" | `ArithmeticException: / by zero` | undefined behavior | panic "attempt to divide by zero" |
| `MIN / -1` | exact (unbounded) | exact as float | result equals `MIN` (spec-defined wrap) | result equals `MIN` | undefined behavior | panic "attempt to divide with overflow" in debug and release |
| Shift count at or above width | unbounded `<<` | operands converted to 32-bit; count masked to 5 bits: `1 << 32 == 1` | result 0 for `<<` (or -1 for `>>` of a negative signed value); negative count panics | count masked: `Int` low 5 bits, `Long` low 6 bits | undefined behavior | debug: panic "attempt to shift left with overflow"; release: count masked; `wrapping_shl` masks explicitly |
| Bitwise ops on large values | unbounded | operands truncated to signed 32-bit; `>>>` gives unsigned 32-bit | per type | per type | per type | per type |
| Parse "  12 " | `int()` strips whitespace, accepts `_` separators and non-ASCII digits (`int("١٢")` is 12) | `Number(" 12 ")` is 12; `Number("")` is 0; `parseInt("12abc")` is 12 | `strconv.Atoi` rejects spaces | `Integer.parseInt` rejects spaces | `strtol` skips leading space, stops at first non-digit | `str::parse` rejects spaces |
| `int(float)` | truncates toward zero | `Math.trunc` | conversion truncates; out of range result is implementation-specific | `(int) d` truncates and saturates; NaN becomes 0 | out of range is undefined behavior | `as` truncates and saturates; NaN becomes 0 |
| Integer promotion | n/a | n/a | none; mixed types are compile errors | `byte + byte` is `int` | `uint8_t + uint8_t` is `int` | none; mixed types are compile errors |

2. Copy only the rows that differ between the two languages of `stack` into a working list.

### Output
Pair-specific difference list.

### Quality Gate
- The working list names both languages in every row.
- No row is copied where both columns are identical.

---

## Phase 2: Find the Sites

### Entry Criteria
- Difference list exists.

### Actions
1. Run the grep set for the source language. Each pattern targets one row.
   - Python: `rg -n "//|%[^s(]|<<|>>|\bint\(|\babs\(|\bpow\(|\*\*" --type py`
   - JavaScript: `rg -n "Math\.(floor|trunc|round)|\|\s*0\b|>>>|<<|>>|parseInt|Number\(|BigInt" --type js`
   - Java: `rg -n "[^/]/[^/*]|%|<<|>>>|>>|\(int\)|\(long\)|Integer\.parseInt|Long\.parseLong|Math\.(abs|floorDiv|floorMod)" --type java`
   - C: `rg -n "[^/]/[^/*]|%|<<|>>|\(int\)|\(unsigned|atoi|strtol|strtoul" --type c`
2. For each hit, decide whether the operands can reach the range where the semantics differ. Use this rule:

| Evidence about operands | Decision |
|---|---|
| Both operands are provably non-negative and bounded below the target type limit (loop index over a collection length, array size) | record as `safe`, with the proof in one line |
| Either operand can be negative and the op is `//`, `/`, or `%` | finding |
| Value can exceed 2^31 - 1 and the target type is 32-bit, or exceed 2^53 - 1 and the target is a JS `number` | finding |
| C signed arithmetic with no proof of range | finding (the source has undefined behavior on overflow; see Phase 3) |
| Shift count comes from input or a variable | finding |
| Cannot decide | finding |

3. Compile and run the C source with UndefinedBehaviorSanitizer to find real overflows: `cc -fsanitize=undefined -fno-sanitize-recover=undefined -g ...`, then run the existing tests. Every `runtime error:` line is a finding with its file:line.

### Output
Site list with decisions.

### Quality Gate
- Every grep hit has a decision (`safe` with proof, or finding).
- For C sources, the UBSan run's output is attached; a run with zero `runtime error:` lines is stated as such.

---

## Phase 3: Choose the Target Construct

### Entry Criteria
- Findings exist.

### Actions
1. Pick the target construct from this table. Do not choose by preference.

| Source behavior to preserve | TypeScript | Go | Kotlin | Rust |
|---|---|---|---|---|
| Python unbounded int that can exceed the target's range | `bigint` end to end | `math/big.Int` | `java.math.BigInteger` | `num-bigint::BigInt` or `i128` when the bound is proven |
| Python `a // b` with possible negatives | helper `floorDiv(a,b)` = `Math.floor(a / b)` only when both are safe integers; for `bigint` use `q = a / b; if ((a % b !== 0n) && ((a < 0n) !== (b < 0n))) q -= 1n` | `q := a / b; if (a%b != 0) && ((a < 0) != (b < 0)) { q-- }` | `Math.floorDiv(a, b)` or `a.floorDiv(b)` | `a.div_euclid(b)` only when `b > 0` is proven; otherwise the Go formula |
| Python `a % b` with possible negatives | `((a % b) + b) % b` when `b > 0` | `((a % b) + b) % b` when `b > 0` | `Math.floorMod(a, b)` or `a.mod(b)` | `a.rem_euclid(b)` when `b > 0` |
| Java or C wrapping arithmetic that the code relies on (hashes, checksums, PRNGs) | `Math.imul(a, b)` for 32-bit multiply, `(x + y) | 0` for 32-bit add, `>>> 0` for unsigned | sized type, wraps by default | wraps by default | `wrapping_add`, `wrapping_mul`, `Wrapping<u32>` |
| C signed overflow (undefined behavior in source) | n/a | n/a | n/a | `checked_add` returning an error; record the input as `ub` in the corpus, never as a golden value |
| Must detect overflow | `Number.isSafeInteger` check | `math/bits.Add64` carry or compare | `Math.addExact` | `checked_*` |
| Shift with variable count | mask explicitly: `count & 31` only if the source masked | check `count < 64` explicitly | Kotlin masks like Java | `checked_shl` or `wrapping_shl` matching the source |
| Lenient parsing (`int(" 12 ")`) | `trim()` then a regex `^[+-]?\d+$` check, then `Number` or `BigInt` | `strings.TrimSpace` then `strconv.ParseInt(s, 10, 64)` | `trim()` then `toLong()` | `trim()` then `parse::<i64>()` |

2. For each finding, write `boundary_inputs` from these exact values, choosing the ones relevant to the operation: `0`, `1`, `-1`, `2^31 - 1` (2147483647), `-2^31`, `2^32`, `2^53 - 1` (9007199254740991), `2^53 + 1`, `2^63 - 1` (9223372036854775807), `-2^63`, `2^64`, and for division the sign combinations `(7,2) (-7,2) (7,-2) (-7,-2)`.
3. For C to Rust, add a note per finding whether release and debug builds will differ; the replay must run both `cargo test` and `cargo test --release`.

### Output
`integer_findings`.

### Quality Gate
- Every finding has a `target_construct` copied from the table or a written formula, and at least two `boundary_inputs`.
- Every division or modulo finding includes all four sign combinations.

---

## Worked Example

Illustrative. `stack=py-ts`, source `pager.py`:
```python
def page_of(index: int, size: int) -> int:
    return index // size
def bucket(h: int, n: int) -> int:
    return h % n
```
Phase 2: `index` comes from user input and can be negative ("last item" uses -1); `h` is a 64-bit hash from `hashlib` (`int.from_bytes(digest[:8], "big")`), so it exceeds 2^53.

Phase 3 rows:
```
I-001 pager.py:2 floor division; Python -1 // 10 == -1, TS Math.trunc(-1/10) == 0
      target: Math.floor(index / size) (both proven within safe integer range)
      boundary: (7,2) (-7,2) (7,-2) (-7,-2) (-1,10)
I-002 pager.py:4 modulo of 64-bit value; TS number loses precision above 2^53 - 1
      target: bigint: Number(((BigInt(h) % BigInt(n)) + BigInt(n)) % BigInt(n)); h parsed with BigInt('0x' + hex)
      boundary: h = 2^53 + 1, 2^63 - 1, 2^64 - 1; n = 7
```

---

## Exit Criteria

DONE when every integer site reachable from an in-scope behavior is either proven safe or has a target construct and boundary inputs.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Too many grep hits to review | **Adjust**: process one file at a time in `port-file-order-plan` order; never mark a file safe without reading it. |
| Phase 2 | UBSan reports overflow in an existing C test | **Adjust**: record it as a source defect; the port defines the behavior and documents the divergence. |
| Phase 3 | No construct in the table fits | **Stop**: write the exact semantics needed and ask the user; do not guess a formula. |
| Phase 3 | A `bigint` change would ripple through many TS signatures | **Adjust**: keep `bigint` inside the module and convert at the boundary with a range check that throws. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
