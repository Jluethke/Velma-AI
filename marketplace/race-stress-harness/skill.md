# Stress Reproduction Harness

**One-line description:** Builds a stress test that starts many workers at the same instant on the suspect operation, runs it a user-chosen number of times with the stack's real repeat tooling, and records the measured baseline failure rate before any fix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `stack` (string, required): One of `go`, `cpp`, `rust`, `java`, `python`, `node`.
- `target_test` (string, required): Existing test that shows the symptom, or `none`.
- `failure_class` (string, required): From `race-symptom-triage`.
- `stress_runs` (integer, required): How many repetitions the user is willing to run per measurement. This is a user choice, not a default.

---

## Outputs

- `stress_command` (string): The exact shell command that runs the stress test once per invocation and exits non-zero on failure, plus the loop command that runs it `stress_runs` times.
- `baseline_failure_rate` (object): `failures`, `runs`, `rate` = failures / runs, and the machine description (CPU count from `nproc` or `sysctl -n hw.ncpu`, OS, language version).

---

## Phase 1: Write the Harness Test

### Entry Criteria
- `failure_class` is set.
- If `target_test` is not `none`, it exists in the repository (`rg -n "<name>" <repo_path>` finds it).

### Actions
1. If `target_test` already starts concurrent workers on the suspect operation, reuse it and skip to Phase 2. Otherwise create ONE new test file next to the existing tests for the suspect code. Do not edit production code in this flow.
2. The harness has four parts, in this order: (a) build shared state exactly as production does, (b) start N workers that block on a start gate, (c) open the gate so all workers run the operation together, (d) wait for all workers and assert the invariant (final count, no duplicate rows, no exception, completes before a timeout).
3. Use the stack's start gate. These are real APIs:

| Stack | Start gate | Wait for all |
|---|---|---|
| go | `start := make(chan struct{})`; workers do `<-start`; then `close(start)` | `sync.WaitGroup` |
| python threads | `threading.Barrier(n)`; each worker calls `barrier.wait()` | `thread.join()` |
| python asyncio | `gate = asyncio.Event()`; workers `await gate.wait()`; then `gate.set()` | `await asyncio.gather(*tasks)` |
| java | `CountDownLatch start = new CountDownLatch(1)`; workers `start.await()`; then `start.countDown()` | `ExecutorService.invokeAll` or a second `CountDownLatch(n)` |
| cpp (C++20) | `std::latch start{1}`; workers `start.wait()`; then `start.count_down()` | `std::thread::join` or `std::jthread` |
| rust | `std::sync::Barrier::new(n)`; each thread `barrier.wait()` | `JoinHandle::join` |
| node | one unresolved promise: `let open; const gate = new Promise(r => (open = r));` workers `await gate`; then `open()` | `await Promise.all(workers)` |

4. Choose N (workers): use the number of logical CPUs from `nproc` (Linux), `sysctl -n hw.ncpu` (macOS) or `$env:NUMBER_OF_PROCESSORS` (Windows) unless the bug report states a concurrency level; then use the reported level. For Node and asyncio, N is the number of concurrent requests in the report, as they run on one thread.
5. For hang classes (`deadlock`, `livelock`, `goroutine-or-thread-leak`), the assertion is a timeout. Use the test framework's timeout, never a hand-written sleep: Go `go test -timeout`, pytest-timeout `--timeout` (plugin), JUnit 5 `@Timeout`, Jest `--testTimeout`, `node --test --test-timeout`. The timeout value is the user's maximum acceptable latency for the operation; ask for it if unknown.
6. Do NOT add `sleep` calls to "help" the race happen in the committed harness. Sleeps belong only in the deterministic regression test flow, where they are replaced by explicit gates.

### Output
One harness test file path and test name.

### Quality Gate
- The harness compiles and runs once: the plain single-run command exits 0 or with a test failure, never with a compile or import error.
- The harness contains a start gate from the table and an explicit invariant assertion (`rg -n "assert|require|expect|Assert" <file>` shows it).

---

## Phase 2: Build the Repeat Command

### Entry Criteria
- Harness test exists.

### Actions
1. Write `stress_command` using the real repeat tool for the stack:
   - go: `go test -run '^TestX$' -count=<stress_runs> -cpu 1,2,4 ./pkg` runs the test `stress_runs` times per CPU setting (`-cpu` sets GOMAXPROCS per run list). For process-level isolation: `go install golang.org/x/tools/cmd/stress@latest`, `go test -c -o pkg.test ./pkg`, `stress -p <N> ./pkg.test -test.run '^TestX$'` (check `stress -h` for the flag that stops after a count on your version).
   - python: `pip install pytest-repeat` then `python -m pytest "<nodeid>" --count=<stress_runs> -x -p no:randomly`. Add `-p no:cacheprovider` if the cache interferes. pytest-repeat's `--count` is real; `-x` stops on the first failure.
   - java JUnit 5: replace `@Test` with `@RepeatedTest(<stress_runs>)` on the harness only, then `mvn -q test -Dtest=<Class>` or `./gradlew test --tests '<Class>'`.
   - node Jest: shell loop `for i in $(seq 1 <stress_runs>); do npx jest <file> -t "<name>" --silent || echo FAIL; done | grep -c FAIL`. node:test: same loop with `node --test <file>`.
   - rust: `for i in $(seq 1 <stress_runs>); do cargo test --release <name> -- --exact || echo FAIL; done | grep -c FAIL`.
   - cpp CTest (CMake 3.17+): `ctest -R '<name>' --repeat until-fail:<stress_runs> --output-on-failure`. Check `ctest --help` for `--repeat` on older CMake.
2. Never use rerun-on-failure options (`-Dsurefire.rerunFailingTestsCount`, `pytest-rerunfailures` `--reruns`, Jest `jest.retryTimes`) in the stress command. They hide the failures this flow must count.
3. Optional amplification, applied one at a time and recorded:
   - Pin to one CPU to force preemption interleavings: `taskset -c 0 <command>` (Linux).
   - Add background CPU load: `stress-ng --cpu <nproc> --timeout <seconds>` in another shell (Linux, install `stress-ng`).
   - Python threads only: call `sys.setswitchinterval(1e-6)` in the harness setup; the documented default is 0.005 seconds, and a smaller value makes the interpreter switch threads more often.

### Output
`stress_command` (single-run and loop forms).

### Quality Gate
- The loop form prints a failure count or exits non-zero on the first failure; run it with `stress_runs` set to 1 to confirm it executes.
- No rerun-on-failure flag appears in `stress_command` (`echo "<stress_command>" | grep -E "rerun|retryTimes|--reruns"` prints nothing).

---

## Phase 3: Measure the Baseline

### Entry Criteria
- `stress_command` runs.

### Actions
1. Run the loop form exactly `stress_runs` times on the unfixed code. Save the full output to a file.
2. Count failures from the output, not from memory: for Go `grep -c -- "--- FAIL" out.txt`, for pytest the final summary line `N failed`, for JUnit the Surefire report `target/surefire-reports/*.txt` line `Tests run: X, Failures: Y`, for loops the `grep -c FAIL` value.
3. Record `baseline_failure_rate` with failures, runs, rate and the machine description.
4. If failures = 0, the harness did not reproduce. Apply ONE amplification from Phase 2 step 3, rerun, and record each attempt. If still 0 after every amplification, report rate 0 and continue; the detector flows (race detector, TSan, debug mode) find races that never fail an assertion.

### Output
`baseline_failure_rate`.

### Quality Gate
- `runs` equals `stress_runs` for the recorded measurement.
- `failures` is copied from a saved output file that can be re-counted with the stated `grep`.

---

## Worked Example

Illustrative only.

Input: `stack` = `go`, `failure_class` = `lost-update`, `target_test` = `none`, `stress_runs` = 200.

Phase 1: creates `inventory/reserve_stress_test.go` with `TestReserveStress`: seeds stock 100, starts `runtime.NumCPU()` goroutines (8 on this machine) blocked on `<-start`, `close(start)`, each calls `Reserve("sku-1", 1)` once, `wg.Wait()`, then `if got := s.Stock("sku-1"); got != 92 { t.Fatalf("stock = %d, want 92", got) }`.

Phase 2: `stress_command` = `go test -run '^TestReserveStress$' -count=200 -cpu 1,2,4 ./inventory`.

Phase 3: output saved; `grep -c -- "--- FAIL" out.txt` prints `37` out of 600 runs (200 per CPU setting). `baseline_failure_rate` = {failures: 37, runs: 600, rate: 0.0617, machine: "8 CPU, Linux 6.8, go1.23.4"}.

---

## Exit Criteria

DONE when a harness test exists that starts workers through a real start gate, `stress_command` repeats it without any rerun-on-failure option, and `baseline_failure_rate` was counted from a saved output file.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Suspect operation cannot be called from a test (needs a live server) | **Adjust**: drive it through the public API with N concurrent HTTP calls from the test (Go `net/http/httptest`, pytest with `httpx.AsyncClient`, Node `supertest`). |
| Phase 1 | Harness fails to compile | **Retry**: fix the harness only; never change production signatures to make the harness compile. |
| Phase 2 | Repeat plugin not installed | **Adjust**: use the shell `for` loop form; it works for every stack. |
| Phase 3 | Rate is 0 after all amplifications | **Return**: record 0 and hand off to the detector flows; do not claim the bug is gone. |
| Phase 3 | Every run fails | **Adjust**: the bug is deterministic, not a race, or the harness is wrong; run once with `-v` and read the first failure before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
