# Parity ULP Compare

**One-line description:** Compares port outputs to golden outputs case by case under the comparison policy, computing exact ULP distance through the ordered-integer mapping of IEEE 754 bit patterns, and writes a machine-readable result with every mismatch listed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `golden_manifest` (string, required): Output of `parity-golden-manifest-lock`.
- `harness_binary` (string, required): Output of `parity-cpp-vector-harness`.
- `comparison_policy` (object, required): Output of `parity-ulp-tolerance-policy`.
- `serialization_spec` (object, required): Output of `parity-canonical-serialization`.

---

## Outputs

- `comparison_results` (object): Per entry point and field: case count, mismatch count, maximum ULP distance, and the full mismatch list (case id, expected pattern, actual pattern, distance).

---

## Phase 1: Produce Port Outputs

### Entry Criteria
- `sha256sum -c golden.sha256` passes.

### Actions
1. Run the harness for every entry point: `./parity_harness <entry> golden/<entry>.jsonl port_out/<entry>.jsonl`.
2. Check line counts match: `wc -l golden/<entry>.jsonl port_out/<entry>.jsonl`.

### Output
Port output files.

### Quality Gate
- One port output file per golden file with an equal line count.

---

## Phase 2: Compare

### Entry Criteria
- Port outputs exist.

### Actions
1. Write `tests/parity/compare.py`. Pair cases by `case` id, never by line number.
2. ULP distance for `float64`, from bit patterns `ua`, `ub` (unsigned 64-bit integers):
   ```python
   def ordered(u):
       return u if u < (1 << 63) else (1 << 63) - u   # negative floats map below zero
   def ulp_distance(ua, ub):
       return abs(ordered(ua) - ordered(ub))
   ```
   This maps `+0.0` (`0x0`) and `-0.0` (`0x8000000000000000`) both to `0`, and adjacent floats to adjacent integers. For `float32` use `1 << 31`.
3. Apply the policy per field, in this order: NaN rule (both NaN means match by class; one NaN means mismatch); infinities must match exactly; `bit_exact` requires `ua == ub`; `ulp` requires `ulp_distance <= bound`; `abs` and `rel` decode to float and compare with the policy bound.
4. Expected exceptions: a golden `{"raises": X}` matches only a port `{"raises": X}`.
5. As a cross-check, run NumPy's own helper on the same arrays: `numpy.testing.assert_array_max_ulp(a, b, maxulp=<bound>)` for `ulp` fields. Both methods must agree on pass or fail.
6. Write `comparison_results` as JSON. Exit code 0 only if every field passes.

### Output
`comparison_results`.

### Quality Gate
- `python tests/parity/compare.py ...; echo $?` prints `0` only when the mismatch count is zero in `comparison_results`.
- A deliberately corrupted output (flip the last hex digit of one case) makes the script exit nonzero and list that case. Run this mutation check once, then restore the file.

---

## Worked Example

Illustrative.

```
$ python tests/parity/compare.py --golden golden --port port_out --policy policy.json --out results.json; echo "exit=$?"
lowpass.step  y      cases=5832 mismatches=0  max_ulp=0
heading.calc  phase  cases=2000 mismatches=3  max_ulp=4  bound=2
  case 1187 expected 3ff921fb54442d18 actual 3ff921fb54442d1c ulp=4
exit=1
```

Three `phase` cases exceed the 2 ULP bound; they go to `parity-divergence-triage`.

---

## Exit Criteria

DONE when every golden case is paired, judged under its field policy, and recorded, and the exit code matches the mismatch count.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Harness crashes partway | **Stop**: run `parity-cpp-sanitizer-sweep` on the crashing case. |
| Phase 2 | Case id missing on one side | **Stop**: report it as a harness defect; never skip unpaired cases. |
| Phase 2 | Mutation check still exits 0 | **Stop**: the comparison is not reading the field; fix it before trusting any pass. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
