# Parity ULP Tolerance Policy

**One-line description:** Decides, per output field, whether parity is judged bit-exact or within a tolerance, and when a tolerance is allowed derives it from measured and documented error bounds or a user requirement, never from a guessed epsilon.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `parity_contract` (object, required): Output of `parity-contract-scope`.
- `libm_findings` (object[], required): Output of `parity-libm-divergence`.
- `reduction_findings` (object[], required): Output of `parity-reduction-order`.

---

## Outputs

- `comparison_policy` (object): Per entry point and output field: mode (`bit_exact`, `ulp`, `abs`, `rel`), the bound, the source of the bound, NaN and signed-zero rules.

---

## Phase 1: Classify Each Output

### Entry Criteria
- `libm_findings` and `reduction_findings` are complete.

### Actions
1. For each output field, trace which operations produce it (from the source on both sides).
2. Apply this table, top row first match:

| Operations producing the field | Mode |
|---|---|
| Only `+ - * /`, `sqrt`, explicit `fma`, conversions, comparisons; same order on both sides; contraction off; no FTZ/DAZ difference | `bit_exact`: IEEE 754-2019 clause 5 requires correct rounding for these, so any difference is a defect |
| Includes a libm function whose `libm_findings` mitigation is "ship one implementation" | `bit_exact` |
| Includes a libm function with nonzero measured error and the contract allows tolerance | `ulp` with a derived bound (Phase 2) |
| Integer or fixed-point only | `bit_exact` |
| Reduction whose orders could not be aligned (`reduction_findings`) | `abs` or `rel` from a user requirement (Phase 2) |

3. Do NOT choose tolerance mode to make an existing mismatch go away. Mismatches go to `parity-divergence-triage` first.

### Output
Mode per output field.

### Quality Gate
- Every output field in `parity_contract` has exactly one mode and the table row that chose it.

---

## Phase 2: Derive Bounds

### Entry Criteria
- Modes assigned.

### Actions
1. For `ulp` mode on a field that is one libm call applied directly to an input: bound = measured maximum ULP error of the reference library plus that of the port library from `libm_findings`, because each side can be off from the correctly rounded value in opposite directions. Cite both measurements.
2. For `ulp` mode on a field computed through further operations after the libm call: the error can be amplified by the condition number of those operations. If no error analysis exists, record the bound as an open question and run the comparison in report-only mode until one exists. Do not invent a multiplier.
3. For `abs` or `rel` mode: the bound must come from a requirement the user supplies (for example a sensor resolution or a downstream specification), cited by document and section.
4. NaN rule: from `serialization_spec` (default: NaN equals NaN by class). Signed zero: `+0.0` and `-0.0` differ in `bit_exact` mode; in `ulp` mode they are 0 ULP apart under the ordered-integer mapping, so state whether that is acceptable per field.
5. Infinity: an infinite value matches only the same infinity in every mode.
6. Emit `comparison_policy` as JSON.

### Output
`comparison_policy`.

### Quality Gate
- Every non-`bit_exact` bound cites a measurement, a document, or is marked `open_question` with report-only enforcement.
- `comparison_policy` contains no bare number without a `source` field.

---

## Worked Example

Illustrative. Outputs: `y` (filter output, only `* +`), `phase` (`atan2` of two inputs).

Phase 1: `y` is `bit_exact` (row 1). `phase` is `ulp` (row 3).

Phase 2: `libm_findings` reports `atan2` max error 1 ULP on glibc x86_64 (reference) and 1 ULP on macOS arm64 (port target). Bound for `phase` = 2 ULP.

```json
{"lowpass.step": {"y": {"mode": "bit_exact", "source": "IEEE 754-2019 clause 5; ops are + and *"}},
 "heading.calc": {"phase": {"mode": "ulp", "bound": 2, "source": "libm_findings atan2: ref 1 + port 1"}}}
```

---

## Exit Criteria

DONE when every output field has a mode, every bound has a cited source or is an open question in report-only mode, and NaN, signed zero, and infinity rules are written.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Field mode depends on an unresolved reduction | **Return**: finish `parity-reduction-order` for that site first. |
| Phase 2 | User asks for a "standard" epsilon like 1e-9 | **Stop**: ask for its source; without one record it as an open question. |
| Phase 2 | Measured libm error is zero on the sample but no document bounds it | **Adjust**: keep `bit_exact` and rely on CI to detect a library change. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
