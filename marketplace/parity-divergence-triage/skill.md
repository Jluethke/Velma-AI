# Parity Divergence Triage

**One-line description:** Takes one mismatching case, dumps intermediate values as bit patterns at matching checkpoints in the reference and the port, finds the first operation where they disagree, and classifies the root cause with a fixed table before any fix is made.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `comparison_results` (object, required): Output of `parity-ulp-compare`.
- `reference_repo` (string, required): Path to the Python reference.
- `port_repo` (string, required): Path to the C++ port.
- `env_fingerprint` (object, required): Output of `parity-env-fingerprint`.

---

## Outputs

- `triage_findings` (object[]): Per investigated case: first divergent checkpoint, the operation, root-cause class, evidence, and the fix applied with its re-run result.

---

## Phase 1: Pick and Reproduce

### Entry Criteria
- `comparison_results` lists at least one mismatch.

### Actions
1. Sort mismatches by ULP distance, then pick the case with the smallest input magnitude among those with the largest distance. Work on one case at a time.
2. Reproduce it alone: write the single input line to `one.jsonl`, run the harness, and confirm the same output pattern.
3. If it does not reproduce alone, the port has state leakage or uninitialized memory between cases; record that as the cause class `state` and go to `parity-cpp-sanitizer-sweep`.

### Output
A single reproducing case.

### Quality Gate
- Running the harness on `one.jsonl` twice yields the same mismatching pattern both times.

---

## Phase 2: Find the First Divergent Operation

### Entry Criteria
- Single reproducing case.

### Actions
1. Add checkpoints at the same algorithm points on both sides. Name each (`cp01_scaled`, `cp02_sum`). Python: `print(name, x.hex())` or the bit-pattern encoder. C++: `std::fprintf(stderr, "%s %a\n", name, x)`. Both print hexadecimal floats, which compare exactly as text.
2. Run both sides on the case and diff: `diff <(python ref_trace.py one.jsonl) <(./harness_trace one.jsonl 2>&1 >/dev/null)`.
3. The first differing line is the divergent checkpoint. If the inputs to that checkpoint agree and the output differs, the cause is inside that one step. If the checkpoint is too coarse, add checkpoints inside that step and repeat. Change only the trace lines; do not change logic while bisecting.
4. Remove the checkpoints after triage, or guard them behind a compile-time switch that is off in production.

### Output
The first divergent operation with its input and output patterns on both sides.

### Quality Gate
- Inputs to the divergent operation are bit-identical on both sides in the trace.

---

## Phase 3: Classify and Fix

### Entry Criteria
- Divergent operation found.

### Actions
1. Classify with this table, first match:

| Evidence at the divergent operation | Class | Fix flow |
|---|---|---|
| `a * b + c` and the port result equals `math.fma(a, b, c)` (Python 3.13+) or an mpmath fused computation | `contraction` | compiler contraction flow |
| Elementary function call, results 1 or more ULP apart | `libm` | `parity-libm-divergence` |
| A sum or dot product, same inputs | `reduction_order` | `parity-reduction-order` |
| A subnormal input or result became zero on one side | `ftz_daz` | `parity-denormal-ftz-daz` |
| `-0.0` vs `+0.0`, or NaN check removed | `fast_math` | `parity-fast-math-audit` |
| Integer division, modulo, shift, rounding, or overflow | `integer_semantics` | `parity-int-fixed-point-semantics` |
| Port reads a value never written | `uninitialized` | `parity-cpp-sanitizer-sweep` |
| Port matches the mathematical intent and the reference does not | `reference_defect` | report to the user; the reference stays authoritative until the user decides |
| None of the above | `unknown` | report as an open question with the trace |

2. Apply one fix in one place, then rerun the full `parity-ulp-compare`, not only this case. Record before and after mismatch counts.
3. Do NOT widen the tolerance, edit goldens, or skip the case as a fix.
4. Emit `triage_findings`.

### Output
`triage_findings`.

### Quality Gate
- Every finding has a class from the table and the trace lines that support it.
- Every applied fix records the full-run mismatch count before and after.

---

## Worked Example

Illustrative. Case 1187, `heading.calc.phase`, 4 ULP apart.

```
$ diff <(python ref_trace.py one.jsonl) <(./harness_trace one.jsonl 2>&1 >/dev/null)
3c3
< cp03_dy 0x1.3c0ca428c59fbp-2
---
> cp03_dy 0x1.3c0ca428c59fcp-2
```

`cp02` agrees. `cp03_dy = a * b + c`; the port value equals the fused result. Class `contraction`. The GCC contraction flow finds a TU missing `-ffp-contract=off`. After the fix the full compare goes from 3 mismatches to 0.

---

## Exit Criteria

DONE when each investigated mismatch has a first divergent operation, a class, and either a fix confirmed by a full rerun or an open question.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Case does not reproduce alone | **Adjust**: classify as `state` and run the sanitizer sweep. |
| Phase 2 | Adding trace output changes the port result | **Stop**: printing forces values to memory; this signals excess precision or UB, run `parity-x87-excess-precision` or the sanitizer sweep. |
| Phase 3 | Fix lowers this case but raises others | **Retry**: revert the fix and reclassify. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
