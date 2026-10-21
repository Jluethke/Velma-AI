# Flaky Test Root Cause Classification

**One-line description:** Assigns a flaky test exactly one primary failure class (timing, race, shared state, test order, parallel collision, network, clock or time zone, randomness, resource leak) by matching measured evidence against a signature decision table, and fixes the baseline command and rate the fix must be verified against.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flake_evidence` (object, required): Signatures, runner facts, timestamps.
- `py_flake_rate_report` (object, optional): From `flk-py-repeat-measure` when `stack` is python.
- `node_flake_rate_report` (object, optional): From `flk-node-jest-loop-measure` when node.
- `go_flake_rate_report` (object, optional): From `flk-go-count-measure` when go.
- `py_order_report` (object, optional): From `flk-py-order-pollution-bisect`.
- `node_order_report` (object, optional): From `flk-node-jest-order-detect`.
- `go_order_report` (object, optional): From `flk-go-shuffle-order-detect`.
- `go_race_report` (object, optional): From `flk-go-race-detect`.
- `tz_matrix_report` (object, optional): From `flk-tz-locale-matrix-detect`. When absent, S5 is "not measured" rather than false; if the failure timestamps in `flake_evidence` cluster near midnight, a date boundary or a DST date, run that flow before choosing a class.
- `stack` (string, required): `python`, `node` or `go`.

---

## Outputs

- `flake_class` (string): One of `timing`, `race`, `shared_state`, `test_order`, `parallel_collision`, `network`, `clock_timezone`, `randomness`, `resource_leak`, `unknown`.
- `root_cause_evidence` (object): `{rule_matched, evidence_lines[], suspect_files[], secondary_classes[], product_bug_suspected}`.
- `baseline_command` (string): The exact command with the highest measured failure rate. Verification reruns it unchanged.
- `baseline_rate` (object): `{failed, runs}` for `baseline_command`.

---

## Phase 1: Gather Signals

### Entry Criteria
- The measurement report for `stack` exists (python, node or go one).

### Actions
1. Build a signal list. For each item, write the evidence line it came from:
   - S1: fails alone in one process (in-process or single-test rate > 0).
   - S2: passes alone, fails with the whole file or suite (order report has a polluter).
   - S3: fails only with parallel workers (`-n`, `--maxWorkers` above 1, `-p` above 1, higher `-cpu`).
   - S4: `go_race_report.races_found` > 0, or Python or Node logs show `concurrent` mutation errors (Go: `fatal error: concurrent map writes`).
   - S5: `tz_matrix_report.tz_dependent` or `locale_dependent` is true.
   - S6: failure messages show varying input values between runs (different generated names, amounts, ids), or failure disappears under a fixed seed (pytest-randomly reseeding, Hypothesis `Falsifying example`, fast-check `seed`).
   - S7: messages show network errors: `ConnectionError`, `ConnectTimeout`, `ECONNREFUSED`, `ECONNRESET`, `ETIMEDOUT`, `getaddrinfo ENOTFOUND`, `EAI_AGAIN`, `dial tcp: lookup`, `i/o timeout`, HTTP 429 or 5xx from a non-localhost host.
   - S8: leak markers: `ResourceWarning: unclosed`, `PytestUnraisableExceptionWarning`, `Too many open files` / `EMFILE`, Jest `did not exit one second after the test run has completed`, `A worker process has failed to exit gracefully`, goleak `found unexpected goroutines`.
   - S9: timing markers: timeouts (`TimeoutError`, `Exceeded timeout of 5000 ms for a test`, `context deadline exceeded`, `test timed out after`), element-not-found or stale-value assertions, a fixed sleep (`time.sleep`, `setTimeout` promise, `time.Sleep`) before the failing assertion, rate that rises under CPU contention.
2. If no S9 contention data exists and S1 holds, rerun `baseline_command` restricted to one CPU (Linux: `taskset -c 0 <command>`; Docker: `docker run --cpus=1 ...`) for the same number of runs the measurement report used; a higher failure count under contention supports S9.

### Output
Signal list with evidence lines.

### Quality Gate
- Every signal marked present quotes a line from a report or log.

---

## Phase 2: Apply The Decision Table

### Entry Criteria
- Signal list complete.

### Actions
1. Walk the table top to bottom; the first matching row is `flake_class`. Rows higher up are causes that produce lower-row symptoms, so order matters.

| # | Signals present | `flake_class` | Fix flow |
|---|---|---|---|
| 1 | S4 | `race` | `flk-go-sync-wait-fix` (Go); Python or Node: `timing` fix flow plus product fix |
| 2 | S7 | `network` | `flk-network-stub-isolate` |
| 3 | S5 | `clock_timezone` | `flk-py-freeze-time-fix`, `flk-node-fake-timers-fix`, `flk-go-clock-injection-fix` |
| 4 | S8 | `resource_leak` | `flk-py-resource-warning-fix`, `flk-node-open-handles-fix`, `flk-go-sync-wait-fix` (goleak) |
| 5 | S2 and the polluter mechanism is a leaked mock, global, env, cache, DOM or file | `test_order` | `flk-py-fixture-isolation-fix`, `flk-node-jest-isolation-fix`, `flk-go-test-isolation-fix` |
| 6 | S3 without S2 | `parallel_collision` | `flk-py-xdist-collision-fix`, `flk-node-jest-isolation-fix`, `flk-go-test-isolation-fix` |
| 7 | S1 with in-process rate > 0 and fresh-process rate 0 | `shared_state` | same as row 5 |
| 8 | S6 | `randomness` | `flk-random-seed-pin` |
| 9 | S9 | `timing` | `flk-py-async-wait-fix`, `flk-node-async-wait-fix`, `flk-go-sync-wait-fix` |
| 10 | none | `unknown` | Return to measurement |

2. Record every other matching row as `secondary_classes`. Fix the primary first, verify, then handle a secondary only if verification still fails.
3. Set `product_bug_suspected` when the failing line or race site is in non-test code. A flaky test that exposes a product race or a product time-zone bug is a product defect; the fix goes in product code with the test kept.
4. Do NOT choose `timing` just because adding a sleep made it pass once. A sleep that "fixes" a test is evidence of S9 only when the rate measured over `repeat_count` drops; one green run is a sample, not a measurement.

### Output
`flake_class`, `root_cause_evidence`.

### Quality Gate
- `rule_matched` names the row number, and each signal in that row has an evidence line.

---

## Phase 3: Fix The Baseline

### Entry Criteria
- `flake_class` is not `unknown`.

### Actions
1. From the stack's measurement and order reports, select the command with the highest failure count at `repeat_count` runs. For order failures, the baseline is the replaying seed or two-test reproduction looped `repeat_count` times.
2. Write it as one copy-pasteable line into `baseline_command`, including environment variables (`TZ=...`), plugin switches (`-p no:randomly`) and seeds.
3. Write `baseline_rate` as the counts from that run, for example `{failed: 8, runs: 149}`.
4. Do NOT change the baseline later to a gentler command. Verification must reuse it.

### Output
`baseline_command`, `baseline_rate`.

### Quality Gate
- `baseline_rate.runs` equals the run count used, and `baseline_rate.failed` > 0.

---

## Worked Example

Illustrative. Python, `test_refund_total`.

- Phase 1: S2 present (`py_order_report.polluter_test_id` = `tests/api/test_pricing.py::test_eur_rounding_mode`, mechanism leaked process setting). S3 present (CI-flags rate 4/112, single 0/112). S5 false.
- Phase 2: row 5 matches first: `flake_class` = `test_order`; secondary `parallel_collision` (row 6). Fix flow `flk-py-fixture-isolation-fix`. Not a product bug: the polluter is a test.
- Phase 3: `baseline_command` = `for i in $(seq 1 112); do python -m pytest -p no:randomly tests/api/test_pricing.py::test_eur_rounding_mode tests/api/test_orders.py::test_refund_total -q || echo FAIL; done`. `baseline_rate` = `{failed: 112, runs: 112}` (deterministic in that order).

---

## Exit Criteria

DONE when `flake_class` is set by a numbered table row with quoted evidence, and `baseline_command` and `baseline_rate` record a measured nonzero failure count.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Stack measurement report missing | **Stop**: run the stack's measurement flow first. |
| Phase 2 | Row 10 (`unknown`) | **Return**: to `flk-flake-evidence-intake` for full logs from more failing runs; do not guess a class. |
| Phase 3 | Baseline rate is 0 locally | **Return**: to measurement; reproduce in the CI container image before fixing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
