# Pytest Flake Rate Measurement

**One-line description:** Measures one pytest test's failure rate at the derived run count in two modes, in-process with pytest-repeat and fresh-process with a shell loop, both at a fixed test order, and records the exact baseline command later used to verify the fix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flake_evidence` (object, required): From `flk-flake-evidence-intake`; supplies `test_id` and the CI command line.
- `repeat_count` (integer, required): N from `flk-run-count-derive`.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `py_flake_rate_report` (object): `{in_process: {command, passed, failed, rate}, fresh_process: {command, passed, failed, rate}, isolated_vs_ci_flags, failure_signatures_seen[], plugins_detected[]}`.

---

## Phase 1: Prepare A Deterministic Harness

### Entry Criteria
- `flake_evidence.is_flaky` is true and `flake_evidence.stack` is `python`.
- The virtualenv used by CI is reproduced: same Python minor version (`python --version`) and same lock file.

### Actions
1. Install the measurement plugin into the dev environment only: `python -m pip install pytest-repeat`. Do not add it to runtime requirements.
2. List active plugins: run `python -m pytest --co "<test_id>"` without `-q` and read the `plugins:` line in the session header (for example `plugins: randomly-3.15.0, xdist-3.6.1`). Record it as `plugins_detected`. If the line is missing, run `python -m pytest --trace-config --co "<test_id>"` and read the `active plugins:` section.
3. Apply this table to make order fixed during measurement:

| Plugin found | Flag to add during measurement | Why |
|---|---|---|
| `randomly` (pytest-randomly) | `-p no:randomly` | Order shuffling is measured separately in `flk-py-order-pollution-bisect`. |
| `rerunfailures` (pytest-rerunfailures) | `-p no:rerunfailures` | Reruns hide failures and corrupt the count. |
| `xdist` | keep the CI value of `-n` in one measurement and `-p no:xdist` in another | Parallelism changes timing and shared resources. |
| `flaky` (the `flaky` package) | `-p no:flaky` | Same reason as rerunfailures. |

4. Check the test file for `@pytest.mark.flaky(reruns=...)` or `@flaky` decorators. If present, measurement must disable the plugin per the table, not edit the decorator.

### Output
Plugin list and the flags to add.

### Quality Gate
- `plugins_detected` is copied from the pytest header or `--trace-config` output.
- No retry plugin is active in the measurement command.

---

## Phase 2: In-Process Repeat

### Entry Criteria
- Harness prepared.

### Actions
1. Run, from `repo_path`:
   `python -m pytest "<test_id>" --count=<repeat_count> --repeat-scope=function -p no:randomly -p no:rerunfailures -q -rf --junitxml=flk-inproc.xml`
   `--count` and `--repeat-scope` are pytest-repeat flags; `--repeat-scope` accepts `function`, `class`, `module`, `session`.
2. Read the last summary line, for example `3 failed, 109 passed in 41.20s`. Record passed and failed.
3. Read the `-rf` short summary: each failed repetition is listed as `FAILED <test_id>[7-112] - <message>`. Copy the distinct messages into `failure_signatures_seen`.
4. Do NOT add `-x`. Stopping at the first failure turns a rate measurement into a single sample.
5. Interpretation rule: if the first repetition passes and later ones fail, the test may pollute itself (state left from its own previous run). Note it.

### Output
`in_process` block.

### Quality Gate
- passed + failed == `repeat_count`, read from the summary line.
- `flk-inproc.xml` exists and its `<testsuite>` `tests` attribute equals `repeat_count`.

---

## Phase 3: Fresh-Process Loop

### Entry Criteria
- In-process measurement recorded.

### Actions
1. bash:
   `pass=0; fail=0; for i in $(seq 1 <repeat_count>); do if python -m pytest "<test_id>" -p no:randomly -p no:rerunfailures -q > "flk-run-$i.log" 2>&1; then pass=$((pass+1)); else fail=$((fail+1)); fi; done; echo "pass=$pass fail=$fail"`
   PowerShell:
   `$p=0;$f=0; 1..<repeat_count> | % { python -m pytest "<test_id>" -p no:randomly -p no:rerunfailures -q *> "flk-run-$_.log"; if ($LASTEXITCODE -eq 0) {$p++} else {$f++} }; "pass=$p fail=$f"`
2. pytest exit code 0 means all passed, 1 means a test failed. Exit codes 2 to 5 mean interrupted, internal error, usage error, or no tests collected; if any run returns one of these, open its log and fix the command before counting.
3. Repeat the loop once more with the CI test selection and flags copied from `flake_evidence` (for example `python -m pytest tests/api -n auto`), adding `--junitxml="flk-ci-$i.xml"`. Here the exit code is not enough, because another test may fail. Count a run as a failure of `test_id` only when its XML has a `<failure>` or `<error>` inside the `<testcase>` whose `name` is the test function: `grep -A2 'name="test_refund_total"' flk-ci-$i.xml | grep -c -E '<failure|<error'`. Record it as `isolated_vs_ci_flags`.
4. Decision table:

| In-process rate | Fresh-process rate | CI-flags rate | Reading |
|---|---|---|---|
| > 0 | about the same | any | Intrinsic to the test (timing, randomness, clock, network). |
| > 0 | 0 | any | State that survives across repetitions in one process (module globals, caches, self-pollution). |
| 0 | 0 | > 0 | Depends on other tests or parallel workers. Go to order and xdist flows. |
| 0 | 0 | 0 | Not reproduced locally. Compare `runner_facts` (OS, CPU count, versions) and rerun inside the CI image. |

5. The baseline command for verification is the command with the highest nonzero rate. Write it verbatim.
6. Delete `flk-run-*.log` and `flk-inproc.xml` only after copying the counts and signatures. They must not be committed.

### Output
`py_flake_rate_report`.

### Quality Gate
- pass + fail == `repeat_count` for every loop, read from the echoed line.
- `git -C <repo_path> status --porcelain` shows no new tracked files.

---

## Worked Example

Illustrative. `test_id` = `tests/api/test_orders.py::test_refund_total`, `repeat_count` = 112.

- Phase 1: header shows `plugins: randomly-3.15.0, xdist-3.6.1, repeat-0.9.3`. Flags: `-p no:randomly`.
- Phase 2: `python -m pytest "tests/api/test_orders.py::test_refund_total" --count=112 --repeat-scope=function -p no:randomly -p no:rerunfailures -q -rf` prints `112 passed in 30.02s`. In-process rate 0/112.
- Phase 3: fresh loop prints `pass=112 fail=0`. CI-flags loop with `-n auto` over `tests/api/` prints `pass=108 fail=4`. Reading: depends on other tests or workers. Baseline command = the `-n auto` loop.

---

## Exit Criteria

DONE when `py_flake_rate_report` holds counts for in-process, fresh-process and CI-flag runs, each summing to `repeat_count`, with the reading from the decision table.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `--count` rejected as unrecognized | **Adjust**: pytest-repeat is not installed in the active interpreter; run `python -m pip show pytest-repeat` and install into the same venv. |
| Phase 2 | `no tests ran` | **Adjust**: `test_id` is wrong; run `python -m pytest --co -q <file>` and copy the exact node id. |
| Phase 3 | Exit code 4 or 5 in the loop | **Stop**: fix the command; those runs are not samples. |
| Phase 3 | All modes 0 failures | **Return**: to `flk-flake-evidence-intake` with a request to rerun inside the CI container image. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
