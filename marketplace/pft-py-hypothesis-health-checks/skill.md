# Hypothesis Health Checks and Flakiness

**One-line description:** Runs every Hypothesis test with `--hypothesis-show-statistics`, then resolves each `FailedHealthCheck`, `DeadlineExceeded`, `Flaky` and `Unsatisfiable` error by its documented cause (strategy shape, slow setup, hidden nondeterminism), never by blanket suppression.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_property_tests` (object[], required): Tests from `pft-py-hypothesis-strategies`.
- `py_state_machine_tests` (object[], optional): Machines from `pft-py-hypothesis-stateful`; absent when the target is stateless.
- `hypothesis_config` (object, required): Profile names and selection mechanism.

---

## Outputs

- `py_health_report` (object[]): One row per test: statistics (passing, failing, invalid counts, runtime line), every health or flakiness error seen, root cause, fix applied, and the clean rerun result.

---

## Phase 1: Collect Statistics

### Entry Criteria
- The test files listed in `py_property_tests` exist.

### Actions
1. Run all property tests under each profile the project uses:

```bash
python -m pytest tests/property -q --hypothesis-show-statistics -p no:randomly
HYPOTHESIS_PROFILE=ci python -m pytest tests/property -q --hypothesis-show-statistics -p no:randomly
```

Drop `-p no:randomly` if `pytest-randomly` is not installed (check `pip show pytest-randomly`).
2. For each test, copy the statistics lines: passing, failing and invalid examples, typical runtimes and the `Stopped because` line.
3. Copy every error block. The ones this flow handles:

| Error text | Class |
|---|---|
| `hypothesis.errors.FailedHealthCheck` with `HealthCheck.filter_too_much` | too many rejected draws |
| `HealthCheck.too_slow` | data generation too slow |
| `HealthCheck.data_too_large` | draws hit the internal buffer limit |
| `HealthCheck.large_base_example` | smallest example is already large |
| `HealthCheck.function_scoped_fixture` | pytest function-scoped fixture reused across examples |
| `HealthCheck.differing_executors` | the same test run from different executor objects (for example a test method on a parametrized class) |
| `hypothesis.errors.DeadlineExceeded` | one example took longer than `deadline` (documented default 200 ms) |
| `hypothesis.errors.Flaky` (or `FlakyFailure` in newer releases) | the same example passed once and failed once |
| `hypothesis.errors.Unsatisfiable` | no valid example could be generated |

### Output
Raw statistics and error list.

### Quality Gate
- Every test in the inputs has a statistics block recorded.
- Every error block is copied verbatim with the test name.

---

## Phase 2: Fix Each Error by Cause

### Entry Criteria
- Error list exists.

### Actions
1. Fix one test at a time. Rerun only that test after each change.
2. Apply the fix from this table. The right column lists what NOT to do.

| Error | Fix | Do not |
|---|---|---|
| `filter_too_much` or `Unsatisfiable` | Replace `.filter` or `assume` with construction (`.map`, `st.builds`, `@st.composite`) so every draw is valid | Add `suppress_health_check=[HealthCheck.filter_too_much]` |
| `too_slow` | Shrink nested strategy sizes to the catalog domain; replace `st.from_regex` with a structural strategy; move expensive setup into a module-scoped fixture | Raise the deadline or suppress the check |
| `data_too_large` or `large_base_example` | Add `max_size` or `max_leaves` from the catalog domain; make recursive strategies bottom out | Set an arbitrary huge size limit |
| `function_scoped_fixture` | Make the fixture reset its state inside the test body, or switch it to module scope; suppress only when the fixture is truly stateless, with a comment saying why | Suppress it to make the warning go away |
| `DeadlineExceeded` | First rerun: if the same example is slow every time, profile it (it may be a real performance bug). If timing varies, set `deadline=None` in the `ci` profile only, with a comment, and keep the dev deadline | Set `deadline=None` globally without checking for a real slow path |
| `Flaky` | Find the hidden state: time, `random` without a seed, dict or set iteration order in output, a module-level cache, a temp file reused between examples, a test that mutates its input. Inject or reset it | Retry the test or mark it `xfail` |

3. For `Flaky`, use `HYPOTHESIS_PROFILE=debug` and rerun with `--hypothesis-seed=<seed>` (the seed printed in the failure, if shown) to see each example. Add `note()` calls to print hidden state.
4. Check that the fix did not shrink the domain below the catalog `input_domain`. If it did, the catalog row must be updated by its owner; record that instead of silently narrowing.

### Output
Fixed tests.

### Quality Gate
- Each fixed test reruns clean under both profiles.
- `git diff` shows no new `suppress_health_check` entries except `function_scoped_fixture` with a comment explaining why the fixture is stateless.
- The invalid example count in the new statistics is lower than before for every filter fix.

---

## Phase 3: Record the Health Report

### Entry Criteria
- All errors handled or returned.

### Actions
1. Rerun the full property suite under both profiles with statistics.
2. Write one `py_health_report` row per test with the before and after statistics and the fix.
3. List any test that still fails with a real assertion error (not a health error) as a target bug for `pft-shrinking-reproduction`.

### Output
`py_health_report`.

### Quality Gate
- The full suite run under the `ci` profile exits 0, or every failure is a real assertion listed as a target bug.
- Zero `FailedHealthCheck` lines in the final output (`grep -c FailedHealthCheck` on the saved log prints 0).

---

## Worked Example

Illustrative. `test_P4_valid_email_roundtrip` used `st.text().filter(is_valid_email)`.

```text
$ python -m pytest tests/property/test_email_props.py -q
E   hypothesis.errors.FailedHealthCheck: It looks like your strategy is filtering out a lot of data.
    Health check found 50 filtered examples but only 0 good ones. ...
    See https://hypothesis.readthedocs.io/en/latest/reference/api.html#hypothesis.HealthCheck
```

Fix: replace the filter with `st.emails()` (a built-in Hypothesis strategy), keeping the round-trip assertion.

```text
$ python -m pytest tests/property/test_email_props.py -q --hypothesis-show-statistics
  - 100 passing examples, 0 failing examples, 0 invalid examples
```

Report row: before `FailedHealthCheck filter_too_much`, cause "filtering random text for a rare format", fix "constructive strategy st.emails()", after "100 passing, 0 invalid".

---

## Exit Criteria

DONE when the property suite runs with zero health check errors under every profile, each fix addresses its root cause, and real assertion failures are handed on as target bugs.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No statistics printed | **Retry**: the plugin flag is missing; confirm `--hypothesis-show-statistics` appears in `pytest --help`. |
| Phase 2 | `Flaky` source cannot be found after the debug run | **Return**: report the test, both outcomes and the seed; do not mark it skipped. |
| Phase 2 | `DeadlineExceeded` on the same example every run | **Return**: report it as a performance bug in the target with the example input. |
| Phase 2 | The only fix narrows the domain below the catalog | **Return**: ask the catalog owner to approve the narrower domain. |
| Phase 3 | Real assertion failures remain | **Return**: pass them to `pft-shrinking-reproduction`; never weaken the assertion. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
