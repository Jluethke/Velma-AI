# Parity Integer and Fixed-Point Semantics

**One-line description:** Finds integer and fixed-point operations whose meaning differs between Python and C++ (floor vs truncating division, modulo sign, shifts of negative values, signed overflow, rounding mode of `round`, float-to-int conversion) and makes each one explicit on both sides.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `reference_repo` (string, required): Path to the Python reference.
- `port_repo` (string, required): Path to the C++ port.
- `parity_contract` (object, required): Output of `parity-contract-scope`, with integer widths recorded.

---

## Outputs

- `integer_findings` (object[]): Each site with a semantic difference, the inputs that expose it, and the explicit form adopted on both sides.

---

## Phase 1: Find Divergent Operations

### Entry Criteria
- Integer widths for every argument are in `parity_contract`.

### Actions
1. Use this table of known differences:

| Operation | Python | C++ | Exposing input |
|---|---|---|---|
| `a // b`, `a / b` on ints | floors toward negative infinity | truncates toward zero | `-7, 2`: Python `-4`, C++ `-3` |
| `a % b` | sign of `b` | sign of `a` | `-7, 2`: Python `1`, C++ `-1` |
| `a >> n` with `a < 0` | arithmetic (floor) | arithmetic since C++20; implementation-defined before | `-7 >> 1`: `-4` |
| overflow of `int32_t` | no overflow, unbounded int | undefined behavior for signed types | `2**31 - 1 + 1` |
| `round(2.5)` | `2` (round half to even) | `std::round` gives `3` (half away from zero); `std::nearbyint` uses the current rounding mode, default to nearest even | `0.5, 1.5, 2.5, -2.5` |
| `np.round(2.5)` | `2.0` (half to even) | see `std::round` above | same |
| `int(x)` for float `x` | truncates; huge values stay exact | `static_cast<int32_t>(x)` is undefined when out of range | `3e9`, `nan` |

2. Sweep both sides for each operation: reference `grep -rnE "//|%|>>|round\(|int\(" <reference_repo>`; port `grep -rnE "[^/]/[^/*]|%|>>|std::round|lround|static_cast<(u?int|int[0-9]+_t)" <port_repo>`. Read every hit; these patterns over-match on purpose.
3. For each matching pair, add the exposing inputs to a test list.

### Output
Site list with exposing inputs.

### Quality Gate
- Every hit from both sweeps is classified as a table row or "not applicable" with a reason.

---

## Phase 2: Make Semantics Explicit

### Entry Criteria
- Site list exists.

### Actions
1. Pick the reference behavior as the target (the reference is authoritative) and write it explicitly in the port:
   - floor division: `q = a / b; if ((a % b != 0) && ((a < 0) != (b < 0))) --q;`
   - Python modulo: `r = a % b; if (r != 0 && ((r < 0) != (b < 0))) r += b;`
   - half-to-even rounding: `std::nearbyint(x)` with the rounding mode left at its default, and a test that asserts `std::fegetround() == FE_TONEAREST`.
2. Bound overflow explicitly: decide per site among wrap (do arithmetic in the unsigned type and convert), saturate, or reject, and write the same rule in the reference with explicit masking (`(a + b) & 0xFFFFFFFF` then sign-adjust) or a range check. The choice comes from the contract or the user, not from this flow.
3. Guard float-to-int conversions: check `std::isfinite(x)` and range before `static_cast`, with the same rejection in the reference.
4. Add the exposing inputs to the golden case list as `edge` cases so the generator keeps them.
5. Build the port with `-fsanitize=undefined` (GCC or Clang) and run the exposing inputs; zero runtime errors expected.
6. Emit `integer_findings`.

### Output
`integer_findings`.

### Quality Gate
- Every exposing input produces identical results on both sides.
- UBSan reports zero `signed integer overflow` and zero `is outside the range of representable values` messages on the exposing inputs.

---

## Worked Example

Illustrative. Fixed-point Q15 filter: reference `y = (a * b) >> 15`; port `int32_t y = (a * b) >> 15;` with `int16_t a, b`.

Exposing inputs `a = -32768, b = -32768`: product `1073741824`, fits `int32_t`; `a = -3, b = 5`: `-15 >> 15` gives `-1` in both (C++20 arithmetic shift). Rounding site `round(y_float)` in the reference vs `std::round` in the port differs at `2.5`; the port changes to `std::nearbyint`.

```
$ ./build-ubsan/parity_harness q15 edge_cases.jsonl out.jsonl
(no runtime error lines)
```

---

## Exit Criteria

DONE when every divergent integer or fixed-point site has one explicit rule on both sides and its exposing inputs pass under UBSan.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Port compiled as C++17 or earlier with negative right shifts | **Adjust**: replace `>>` on signed values with an explicit floor division by a power of two. |
| Phase 2 | Overflow rule not in the contract | **Return**: ask the user for wrap, saturate, or reject; do not choose. |
| Phase 2 | UBSan finds overflow in code outside the list | **Adjust**: add the site to the list and repeat Phase 2 for it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
