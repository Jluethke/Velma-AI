# Parity Hypothesis Differential Test

**One-line description:** Runs randomized differential testing of the Python reference against the C++ port in one process with Hypothesis, generating floats across the full IEEE 754 range including subnormals and special values, shrinking each disagreement to a minimal input, and pinning it as a permanent example.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `reference_repo` (string, required): Path to the Python reference.
- `py_binding` (string, required): Output of `parity-pybind11-binding`.
- `comparison_policy` (object, required): Output of `parity-ulp-tolerance-policy`.

---

## Outputs

- `differential_failures` (object[]): Each shrunk failing input with the reference output, port output, ULP distance, Hypothesis seed, and the `@example` line added.

---

## Phase 1: Write the Property

### Entry Criteria
- `import parity_port` works and matches the standalone harness bit for bit.

### Actions
1. Install: `pip install hypothesis pytest`.
2. Create `tests/parity/test_differential.py`:
   ```python
   from hypothesis import given, settings, example, strategies as st
   import reference.lowpass as ref, parity_port as port
   from tests.parity.compare import judge   # same judge as parity-ulp-compare
   f64 = st.floats(allow_nan=True, allow_infinity=True, allow_subnormal=True, width=64)
   @settings(max_examples=MAX_EXAMPLES, deadline=None)
   @given(x=f64, s0=f64, s1=f64)
   def test_step(x, s0, s1):
       r = ref.step(x, [s0, s1]); p = port.step(x, [s0, s1])
       assert judge("lowpass.step", r, p), (r, p)
   ```
3. Restrict strategies to the contract domain only if the contract says inputs outside it cannot reach the port in production. Otherwise keep the full range.
4. `MAX_EXAMPLES` is a user input. Hypothesis documents a default of 100 when `max_examples` is not set.
5. Use the same `judge` function as `parity-ulp-compare` so both tests apply one policy. Do NOT write a second, looser comparison here.
6. If the reference raises for an input, the property must require the port to report the same error class, not skip the case.

### Output
Property test file.

### Quality Gate
- The test imports the shared `judge` and contains no `math.isclose` or `pytest.approx` call.
- `allow_subnormal=True` and `allow_nan` match the special-value scope in the contract.

---

## Phase 2: Run, Shrink, Pin

### Entry Criteria
- Property test exists.

### Actions
1. Run: `PYTHONPATH=build pytest tests/parity/test_differential.py -p no:cacheprovider --hypothesis-show-statistics --hypothesis-seed=<seed>`. Record the seed so the run can be repeated.
2. On failure, Hypothesis shrinks and prints `Falsifying example: test_step(x=..., s0=..., s1=...)`. Copy those exact values.
3. Add each falsifying input as `@example(x=..., s0=..., s1=...)` above `@given`, written with `float.fromhex("...")` so the value is exact.
4. Do NOT fix the port in this flow. Record the failure and send it to `parity-divergence-triage`.
5. Hypothesis also stores failures in `.hypothesis/examples` and replays them on the next run; keep that directory out of version control and rely on the `@example` lines for permanence.
6. Emit `differential_failures`.

### Output
`differential_failures`.

### Quality Gate
- Every entry in `differential_failures` has a matching `@example` line in the test file.
- Rerunning with the same `--hypothesis-seed` reproduces the same failures.

---

## Worked Example

Illustrative.

```
$ PYTHONPATH=build pytest tests/parity/test_differential.py --hypothesis-seed=12345 -q
Falsifying example: test_step(x=5e-324, s0=0.0, s1=-0.0)
AssertionError: ((0.0, [5e-324, 0.0]), (0.0, [0.0, 0.0]))
1 failed
```

The port flushed a subnormal state value to zero. Added `@example(x=float.fromhex("0x0.0000000000001p-1022"), s0=0.0, s1=-0.0)` and recorded the failure for triage, which points to `parity-denormal-ftz-daz`.

---

## Exit Criteria

DONE when the property ran with a recorded seed and every falsifying input is pinned as an `@example` and listed in `differential_failures`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Reference rejects most generated inputs | **Adjust**: generate inside the contract domain and record that the full range is not covered. |
| Phase 2 | Hypothesis health check fails for slow tests | **Adjust**: keep `deadline=None` and lower nothing else; do not suppress `HealthCheck` without recording why. |
| Phase 2 | Failure does not reproduce with the seed | **Stop**: there is nondeterminism (threads, uninitialized memory); run `parity-cpp-sanitizer-sweep`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
