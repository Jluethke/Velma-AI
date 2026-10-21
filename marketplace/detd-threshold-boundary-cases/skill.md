# Threshold Boundary Case Derivation

**One-line description:** For every limit in the decision logic, derives the test values at the limit, at the adjacent representable value below and above (`nextafter` for floats, plus and minus one for integers), across unit conversions, hysteresis pairs and debounce counts, with each case's expected decision taken from the specification rather than from current code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `limit_spec` (object[], required): Each limit from the specification: `name`, `value`, `unit`, `comparison` (for example "speed above limit triggers": strict `>` or inclusive `>=` as written in the spec), `type` (float64, float32, int with width), and the spec section it comes from.

---

## Outputs

- `boundary_cases` (object[]): Per case: `limit_name`, `input_value` in exact form (hex float or integer), `relation` (below_adjacent, at, above_adjacent, special), `expected_decision` from the spec, `code_site` (file and line of the comparison), and `spec_ref`.

---

## Phase 1: Locate Every Comparison

### Entry Criteria
- Every `limit_spec` row has `comparison` stated explicitly as strict or inclusive. If the spec is silent, that row is an open question; do not decide it from code.

### Actions
1. For each limit, find its use: `rg -n '<constant_name>' <repo_path>` and also search for the literal value (`rg -n '\b<value>\b'`), because duplicated literals are common.
2. For each hit record the operator used (`<`, `<=`, `>`, `>=`, `==`) and the type of both operands.
3. Flag mismatches: spec says inclusive and code uses strict, or the reverse. Flag duplicated literals that are not the named constant. Flag comparisons between different types (for example float32 input against float64 limit; the float32 value is widened, so the effective boundary is the nearest float32 to the limit).

### Output
Comparison site table with flags.

### Quality Gate
- Every `limit_spec` row has at least one `code_site`, or is flagged "limit not implemented".
- Every row lists operator and operand types.

---

## Phase 2: Generate Values

### Entry Criteria
- Comparison sites located.

### Actions
1. For each limit L, generate:

| type | below_adjacent | at | above_adjacent |
|---|---|---|---|
| float64 | `math.nextafter(L, -math.inf)` (Python 3.9+) or `std::nextafter(L, -INFINITY)` | `L` as stored (print `float.hex(L)`; the decimal in the spec may not be exactly representable) | `math.nextafter(L, math.inf)` |
| float32 | `np.nextafter(np.float32(L), np.float32(-np.inf))` or `std::nextafterf` | `np.float32(L)` | `np.nextafter(np.float32(L), np.float32(np.inf))` |
| integer | `L - 1` | `L` | `L + 1` |

2. Unit conversion: if the input arrives in another unit (for example m/s while the limit is in km/h), compute the converted limit as the code computes it (same expression, same type), then generate the three values around the converted value. `L / 3.6` is not exact, so the boundary in input units is where the code's expression flips, not the decimal value.
3. Special values for float inputs: `NaN`, `+inf`, `-inf`, `-0.0`, `0.0`. NaN makes every ordered comparison false, so `if (x > L) trip()` does not trip on NaN; the spec decides what NaN must do.
4. Integer inputs: type minimum and maximum, and values that overflow intermediate arithmetic.
5. Hysteresis (separate enter and exit limits): sequences, not single values: rise to `enter_above_adjacent`, fall to `exit_at`, fall to `exit_below_adjacent`, and the reverse.
6. Debounce of N consecutive ticks (N from the spec): sequences of N-1, N and N+1 ticks over the limit, and N ticks with one interruption.
7. Two limits on one decision: the four corner combinations of their adjacent values.

### Output
Value list per limit.

### Quality Gate
- Every float value is written in hex form and reproduces with `float.fromhex`.
- Every limit has at least the three relation rows, plus special rows for float inputs.

---

## Phase 3: Attach Expected Decisions

### Entry Criteria
- Values generated.

### Actions
1. For each case, write `expected_decision` by reading the spec text, not by running the code.
2. Then run the code on each case and compare. Mismatches are either code defects or spec ambiguities; list each with the spec section.
3. Do not change expected values to match the code. Do not delete a case because it fails.

### Output
`boundary_cases`.

### Quality Gate
- Every case has `expected_decision` with a `spec_ref`.
- The mismatch list is reported, even when empty.

---

## Worked Example

Illustrative only. Limit `max_lateral_accel`, value 3.0 m/s^2, float64, spec: "above the limit" (strict). Code: `if (a_lat >= kMaxLatAccel)` in `limits.cpp:41`. Flag: inclusive versus strict. Values: `0x1.7ffffffffffffp+1`, `0x1.8p+1`, `0x1.8000000000001p+1`, NaN. Expected at `0x1.8p+1`: not triggered (spec strict). Running the code: triggered. Reported as a code defect.

---

## Exit Criteria

DONE when every specified limit has located code sites, adjacent and special values in exact form, sequences for hysteresis and debounce, and spec-derived expectations with mismatches reported.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Spec does not say strict or inclusive | **Return**: list as open question; generate values but leave `expected_decision` empty for `at`. |
| Phase 1 | Limit found only as a literal in several places | **Adjust**: list all sites; recommend one named constant. |
| Phase 2 | Conversion expression unclear | **Adjust**: copy the expression from code verbatim into the generator. |
| Phase 3 | Code disagrees with spec | **Return**: report; never edit expectations to match code. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
