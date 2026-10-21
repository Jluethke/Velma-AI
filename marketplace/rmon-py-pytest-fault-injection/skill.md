# Python Fault Injection with pytest

**One-line description:** Runs every fault injection case whose executor is Python as a `pytest.mark.parametrize` case loaded from the plan file, feeds the fault into the range, rate and staleness checkers through their public API and a fake clock, and writes a JUnit XML report plus a JSON Lines results file with expected and observed verdicts per case.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fault_injection_plan` (object[], required): Output of `rmon-fault-injection-plan`, saved as `fault_injection_plan.json`.
- `py_range_rate_checker` (object, required): Output of `rmon-py-rate-range-check`.
- `py_staleness_checker` (object, required): Output of `rmon-py-staleness-timeout`.
- `repo_dir` (string, required): Monitor repository root.

---

## Outputs

- `py_fault_results` (object[]): One row per case: `case_id`, `label`, `expected_verdict`, `observed_verdict`, `detected` (bool), `t_inject_ns`, `t_detect_ns`, `outcome` (`pass` or `fail`). Also the JUnit XML path.

---

## Phase 1: Load Cases into pytest

### Entry Criteria
- The checker unit tests from both input flows pass.
- At least one plan case has `executor == "rmon-py-pytest-fault-injection"`.

### Actions
1. Create `tests/test_fault_injection.py`:
   ```python
   import json, math, pytest
   from monitor.range_rate import RangeRateChecker, load_bounds
   from monitor.staleness import StalenessChecker

   CASES = [c for c in json.load(open("fault_injection_plan.json"))
            if c["executor"] == "rmon-py-pytest-fault-injection"]
   RESULTS = []

   @pytest.mark.parametrize("case", CASES, ids=[c["case_id"] for c in CASES])
   def test_case(case):
       observed, t_inj, t_det = run_case(case)   # defined below, one branch per fault_model
       RESULTS.append({...})
       assert observed == case["expected_verdict"]
   ```
2. Write `run_case` with one branch per `fault_model` from the plan. Parse parameters explicitly: `"nextafter(2.0, inf)"` becomes `math.nextafter(2.0, math.inf)` via a small mapping, never `eval`.
3. For timing faults (omission), use the fake clock from the staleness tests: advance it by the injected gap, then call `poll()`. Record `t_inject_ns` as the fake time when the last message was sent and `t_detect_ns` as the first fake time `poll()` returned `stale`, stepping the clock by the monitor's poll period.
4. Dump `RESULTS` to `fault_results.jsonl` from a session-scoped fixture or `pytest_sessionfinish` hook in `conftest.py`.

### Output
Parametrized test module.

### Quality Gate
- `python -m pytest tests/test_fault_injection.py --collect-only -q | tail -1` reports a count equal to the number of Python-executor cases in the plan.
- `rg -n "eval\(" tests/test_fault_injection.py` returns nothing.

---

## Phase 2: Run and Report

### Entry Criteria
- Collection count matches.

### Actions
1. Run: `python -m pytest tests/test_fault_injection.py -q --junitxml=reports/fault_injection.xml`.
2. Read the JUnit XML summary: `python -c "import xml.etree.ElementTree as E; r=E.parse('reports/fault_injection.xml').getroot(); s=r if r.tag=='testsuite' else r[0]; print(s.get('tests'), s.get('failures'), s.get('errors'))"`.
3. For every failed case, classify:
   - `must_trip` and not detected: a missed trip. Fix the checker, never the expected verdict.
   - `must_not_trip` and detected: a false trip. Check the bound comparison (`>` versus `>=`) against the property's hand trace.
4. Rerun until all pass. Each code change touches one file and is followed by the full run.

### Output
`py_fault_results`.

### Quality Gate
- JUnit XML shows `failures` 0 and `errors` 0.
- `wc -l fault_results.jsonl` equals the number of Python-executor cases.

---

## Worked Example

Illustrative only.
```
$ python -m pytest tests/test_fault_injection.py -q --junitxml=reports/fault_injection.xml
.....F......................                                    [100%]
FAILED tests/test_fault_injection.py::test_case[FI-019] - AssertionError: assert 'pass' == 'fail'
```
FI-019 is `counter repeat` labeled `must_trip`: a missed trip. The checker compared counters only when `seq_modulo` was set; the plan's signal had it unset in config. Fixed the config load, reran: `28 passed`.

---

## Exit Criteria

DONE when every Python-executor case runs from the plan file, results are in JUnit XML and JSON Lines with injection and detection times, and no case fails.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Fault model not handled by `run_case` | **Adjust**: add the branch; do not skip the case. |
| Phase 2 | Missed trip | **Retry**: fix checker code, rerun all cases. |
| Phase 2 | Expected verdict in plan appears wrong | **Return**: to `rmon-fault-injection-plan` with the case ID; do not edit the plan here. |

**Do not:** mark cases `xfail` or `skip` to get green, edit expected verdicts, use `eval` on plan strings, or claim success without the JUnit XML.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
