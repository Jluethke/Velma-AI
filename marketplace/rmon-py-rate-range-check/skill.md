# Python Range and Rate Checker

**One-line description:** Implements a pure-Python range and rate-of-change checker driven only by `operating_envelope.json`, rejecting NaN and infinity before any comparison, and proves it with pytest boundary tests plus Hypothesis property-based tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `operating_envelope` (object[], required): Output of `rmon-envelope-from-requirements`, saved as `operating_envelope.json` in the repo.
- `repo_dir` (string, required): Monitor repository root (not the marketplace).

---

## Outputs

- `py_range_rate_checker` (object): Module path (`monitor/range_rate.py`), test path (`tests/test_range_rate.py`), pytest summary line, and the envelope hash the tests ran against.

---

## Phase 1: Implement the Checker

### Entry Criteria
- `python --version` prints 3.9 or newer.
- `operating_envelope.json` exists in `repo_dir` and every row used has numeric `min` and `max`.

### Actions
1. Create ONE file, `monitor/range_rate.py`. Do not edit other files in this phase.
2. Implement:
   ```python
   import json, math
   from dataclasses import dataclass

   @dataclass(frozen=True)
   class Bound:
       signal: str
       lo: float
       hi: float
       max_rate: float | None  # units per second; None when the envelope field is open

   def load_bounds(path):
       rows = json.load(open(path, encoding="utf-8"))
       return {r["signal"]: Bound(r["signal"], float(r["min"]), float(r["max"]),
               None if r.get("max_rate") is None else float(r["max_rate"])) for r in rows}

   class RangeRateChecker:
       def __init__(self, bound):
           self.b = bound
           self.prev = None  # (value, t_ns)

       def check(self, value, t_ns):
           if not isinstance(value, (int, float)) or not math.isfinite(value):
               return "invalid_input"
           if value < self.b.lo or value > self.b.hi:
               verdict = "fail"
           else:
               verdict = "pass"
           if verdict == "pass" and self.b.max_rate is not None and self.prev is not None:
               dt = (t_ns - self.prev[1]) / 1e9
               if dt <= 0:
                   verdict = "invalid_input"
               elif abs(value - self.prev[0]) / dt > self.b.max_rate:
                   verdict = "fail"
           if verdict != "invalid_input":
               self.prev = (value, t_ns)
           return verdict
   ```
   On Python 3.9 replace `float | None` with `Optional[float]` from `typing`.
3. Rules the code must keep: compare with `<` and `>` so the boundary value passes (matching the STL hand traces where reliableness 0 is satisfied); never clamp the value (a monitor reports, it does not repair); return `invalid_input` for NaN, infinity, wrong type and non-increasing time.

### Output
`monitor/range_rate.py`.

### Quality Gate
- `python -c "import monitor.range_rate"` exits 0 from `repo_dir`.
- `rg -n "min\(|max\(|clip|clamp" monitor/range_rate.py` returns nothing (no clamping).

---

## Phase 2: Boundary Tests

### Entry Criteria
- Module imports.

### Actions
1. `python -m pip install pytest hypothesis`.
2. Create `tests/test_range_rate.py` with these cases for each envelope row: value equal to `min` passes; equal to `max` passes; `math.nextafter(max, math.inf)` fails (`math.nextafter` needs Python 3.9); `float('nan')` gives `invalid_input`; `float('inf')` gives `invalid_input`; two samples with identical `t_ns` give `invalid_input`; a step exactly at `max_rate * dt` passes, one `nextafter` above fails.
3. Run `python -m pytest tests/test_range_rate.py -q`.

### Output
Boundary test file and results.

### Quality Gate
- pytest prints `N passed` with zero failures and zero errors.
- The test file contains `nextafter` and `nan` (`rg -c "nextafter|nan" tests/test_range_rate.py` greater than 0).

---

## Phase 3: Property-Based Tests

### Entry Criteria
- Boundary tests pass.

### Actions
1. Add Hypothesis tests:
   ```python
   from hypothesis import given, strategies as st
   @given(st.floats(allow_nan=True, allow_infinity=True))
   def test_never_passes_outside_bounds(v):
       c = RangeRateChecker(Bound("x", -0.5, 2.0, None))
       r = c.check(v, 1)
       if r == "pass":
           assert -0.5 <= v <= 2.0
   ```
2. Add a second property: for any finite sequence, `check` never raises.
3. Run `python -m pytest -q --hypothesis-show-statistics`.
4. If Hypothesis finds a failure, fix the code. Do NOT add `assume()` to exclude the failing input and do NOT delete the test.

### Output
`py_range_rate_checker`.

### Quality Gate
- `python -m pytest -q` exits 0.
- `git diff --stat` shows only `monitor/range_rate.py` and `tests/test_range_rate.py` changed.

---

## Worked Example

Illustrative only.
```
$ python -m pytest tests/test_range_rate.py -q
..........                                                     [100%]
10 passed in 0.41s
$ python -m pytest -q --hypothesis-show-statistics
tests/test_range_rate.py::test_never_passes_outside_bounds:
  - during generate phase (0.32 seconds):
    - Typical runtimes: < 1ms, of which < 1ms in data generation
    - 100 passing examples, 0 failing examples, 7 invalid examples
12 passed in 1.02s
```

---

## Exit Criteria

DONE when the checker loads bounds only from the envelope file, rejects non-finite input, never clamps, and boundary plus property tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Envelope `max_rate` is null | **Adjust**: skip the rate check for that signal and keep the open question; never substitute a value. |
| Phase 2 | Boundary test fails at exactly `max` | **Retry**: check the comparison uses `>` not `>=`. |
| Phase 3 | Hypothesis reports a falsifying example | **Retry**: fix the code; rerun with the same seed printed by Hypothesis. |

**Do not:** hardcode bounds in Python, clamp values, weaken assertions to get green, or edit several modules at once.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
