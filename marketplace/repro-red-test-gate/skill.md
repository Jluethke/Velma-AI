# Red Regression Test Gate

**One-line description:** Selects the one stack-specific regression test that was produced, reruns it the required number of times from a clean checkout of the current commit, and refuses to pass unless it fails every time with the reported signature and fails for no other reason.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_regression_test` (object, optional): From `repro-py-pytest-regression-test`; empty unless `stack` is python.
- `node_regression_test` (object, optional): From `repro-node-jest-vitest-regression-test`; empty unless `stack` is node.
- `go_regression_test` (object, optional): From `repro-go-test-regression-test`; empty unless `stack` is go.
- `java_regression_test` (object, optional): From `repro-java-junit5-regression-test`; empty unless `stack` is java.
- `rust_regression_test` (object, optional): From `repro-rust-cargo-regression-test`; empty unless `stack` is rust.
- `cpp_regression_test` (object, optional): From `repro-cpp-gtest-ctest-regression-test`; empty unless `stack` is cpp.
- `stack` (string, required): One of `python`, `node`, `go`, `java`, `rust`, `cpp`.
- `confirm_runs` (integer, required): Number of repeated red runs; a user input.

---

## Outputs

- `regression_test` (object): The selected test: file, name, run command (including any `TZ=`, seed or sanitizer prefix), and the signature line it fails with. Stack-neutral shape used by every later flow.
- `red_run_log` (object): Exit code and signature-match result for each of the `confirm_runs` runs, plus the commit SHA they ran against.

---

## Phase 1: Select the Test

### Entry Criteria
- `stack` is set.

### Actions
1. Map `stack` to its input: python to `py_regression_test`, node to `node_regression_test`, go to `go_regression_test`, java to `java_regression_test`, rust to `rust_regression_test`, cpp to `cpp_regression_test`.
2. If the mapped input is empty, stop: the stack flow did not run.
3. If any other stack input is non-empty, record a warning (the wrong condition fired) and ignore it.
4. Copy file, name, run command and signature line into `regression_test`.

### Output
Draft `regression_test`.

### Quality Gate
- Exactly one stack input is used and it matches `stack`.

---

## Phase 2: Confirm Red from a Clean Tree

### Entry Criteria
- Draft `regression_test` exists.

### Actions
1. Record `git rev-parse HEAD`. Run `git status --porcelain`; the only modified or new tracked paths allowed are the test file and fixtures. If any source file is modified, stop.
2. Clear stack caches that can replay old results: python `-p no:cacheprovider`; go `-count=1`; jest `--no-cache` on the first run; cargo and cmake rebuild incrementally, which is correct.
3. Run the test command `confirm_runs` times. For each run record exit code and whether output contains the signature line (`grep -F`).
4. Classify every run:

| Exit code | Signature found | Class |
|---|---|---|
| non-zero | yes | red (correct) |
| non-zero | no | wrong failure (test broken, different bug, or environment) |
| zero | any | green (test does not catch the bug, or the bug is intermittent) |

5. Paste the classes into `red_run_log`.

### Output
`red_run_log`.

### Quality Gate
- `red_run_log` has exactly `confirm_runs` entries, each with an exit code read from the shell (`$?` or `$LASTEXITCODE`).

---

## Phase 3: Verdict

### Entry Criteria
- `red_run_log` complete.

### Actions
1. Pass only if every run is class red.
2. If any run is green: return to `repro-nondeterminism-pin` findings and make the test construct the failing condition directly (fixed seed, explicit order, fixed clock). Do not raise `confirm_runs` or lower it to hide the green run.
3. If any run is a wrong failure: return to the stack test flow and fix the test.

### Output
Verdict on `regression_test`.

### Quality Gate
- The verdict line states "RED CONFIRMED <n>/<n>" with n equal to `confirm_runs`, or names the failing class and the flow to return to.

---

## Worked Example

Illustrative only. `stack` = go, `confirm_runs` = 10.

- Phase 1: `go_regression_test` non-empty, others empty. `regression_test.command` = `go test ./internal/cache -run '^TestLRU_PutOnZeroValue$' -count=1 -v`.
- Phase 2: HEAD `a41c9d0`; `git status --porcelain` shows `M internal/cache/lru_test.go` only. Ten runs, all exit 1 with `panic: assignment to entry in nil map`.
- Phase 3: "RED CONFIRMED 10/10".

---

## Exit Criteria

DONE when the selected regression test fails with the reported signature on every one of `confirm_runs` runs against an unmodified source tree.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Mapped input empty | **Stop**: run the stack flow for `stack` first. |
| Phase 2 | Source file modified before the gate | **Stop**: stash the source change; a red test against fixed code proves nothing. |
| Phase 3 | Some runs green | **Return**: to `repro-nondeterminism-pin` and the stack test flow; force the failing condition in the test. |
| Phase 3 | Weak model reports "red" from one run | **Retry**: run all `confirm_runs` and paste every exit code. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
