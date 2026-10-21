# Deterministic Concurrency Regression Test

**One-line description:** Writes one regression test per root cause that forces the bad interleaving every run with explicit gates (latches, events, controlled promises, test hooks, Go `testing/synctest`), proves it fails on the unfixed code, and keeps it in the suite without sleeps or retries.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root.
- `stack` (string, required): One of `go`, `cpp`, `rust`, `java`, `python`, `node`.
- `race_sites` (object[], required): From `race-findings-consolidate`.
- `root_cause` (string, required): From `race-findings-consolidate`.

---

## Outputs

- `regression_test` (object): `file`, `test_name`, `run_command` (single run), `forced_ordering` (the step sequence the gates impose), `fails_before_fix` (copied failure message from the unfixed code), `seam` (the hook or injected dependency used to pause production code).

---

## Phase 1: Choose the Seam

### Entry Criteria
- `root_cause` names two accesses (file:line).

### Actions
1. Write the bad ordering as numbered steps from the root cause, for example: (1) worker A reads stock, (2) worker B reads stock, (3) A writes, (4) B writes.
2. Choose how the test pauses production code between steps, first matching row:

| Condition | Seam |
|---|---|
| The code between the two accesses calls an injected dependency (repository, client, clock, callback) | Fake that dependency; its method blocks on a gate the test controls |
| Go code with goroutines, timers and channels only, and Go 1.25 or later (or 1.24 with `GOEXPERIMENT=synctest`) | `testing/synctest`: run in `synctest.Test(t, func(t *testing.T) {...})` (1.25) and use `synctest.Wait()` to reach a point where every goroutine in the bubble is durably blocked. Check `go doc testing/synctest` for your version's API |
| Python asyncio code awaiting something between the accesses | Fake the awaited call with an `asyncio.Event` it waits on |
| Node code awaiting something between the accesses | Fake it with a deferred promise (resolve by hand) |
| Rust atomics or a custom primitive | The loom model from `race-rust-loom` is the regression test |
| Java visibility or compound-update bug | The jcstress test from `race-java-jcstress` is the regression test, plus a JUnit test with `CountDownLatch` gates for logic ordering |
| Database anomaly | Two connections in the test, statements issued in the two-session script order from the database report |
| No injected dependency exists | Add a minimal test hook: a package-private or internal function variable that defaults to a no-op and that the test replaces (Go `var testHookAfterRead = func() {}`; the Go standard library uses this pattern, for example `net/http` testHook variables) |

3. A test hook adds one line to production code. Keep it to one no-op call at the point between the two accesses. Do not add `if testing` branches that change behavior.

### Output
Step list and seam choice.

### Quality Gate
- The step list has the two accesses from `root_cause` in the order that breaks the invariant.
- The seam is one table row.

---

## Phase 2: Write the Test

### Entry Criteria
- Seam chosen.

### Actions
1. Write ONE test in the existing test file for the module (create one next to it only if none exists). Use gates, never sleeps:

| Stack | Gate to pause | Gate to resume |
|---|---|---|
| go | `reached := make(chan struct{})`; hook does `reached <- struct{}{}; <-release` | `close(release)` |
| java | `CountDownLatch reached = new CountDownLatch(1); CountDownLatch release = new CountDownLatch(1);` hook calls `reached.countDown(); release.await();` | `release.countDown()` |
| python threads | `threading.Event()` pair; hook calls `reached.set(); release.wait(timeout=<test timeout>)` | `release.set()` |
| python asyncio | `asyncio.Event()` pair, awaited in the fake | `release.set()` |
| node | deferred promise per pause point | `resolve()` |
| cpp | `std::latch` (C++20) or `std::promise<void>` / `std::future<void>` pair | `count_down()` / `set_value()` |
| rust | `std::sync::Barrier` or `std::sync::mpsc` channel pair | `send(())` |

2. Drive the steps: start A, wait for A's `reached`, start B and let it run to its own pause or to completion as the step list says, then release A. Assert the invariant at the end with the specific value (`want 2, got 1`), not a generic "no error".
3. Every blocking wait in the test has a timeout taken from the test framework (Go `-timeout`, JUnit `@Timeout`, pytest-timeout, Jest `testTimeout`) so a regression hangs for a bounded time and fails.
4. Do NOT:
   - use `sleep` or `setTimeout` to order steps,
   - mark the test flaky, skip it, or wrap it in a retry,
   - assert with a tolerance ("count within 1 of expected").

### Output
Test file and test name.

### Quality Gate
- `rg -n "time\.Sleep|Thread\.sleep|time\.sleep|asyncio\.sleep|setTimeout|std::this_thread::sleep_for|thread::sleep" <test file>` shows no hits inside the new test.
- The test asserts a specific expected value.

---

## Phase 3: Prove It Fails, Then Prove It Is Deterministic

### Entry Criteria
- Test written, production code unfixed.

### Actions
1. Run the single test on the unfixed code with the stack's command (for example `go test -run '^TestReserveLostUpdate$' -count=1 ./inventory`, `python -m pytest "<nodeid>"`, `mvn -q test -Dtest=<Class>#<method>`, `npx jest <file> -t "<name>"`, `cargo test <name> -- --exact`, `ctest -R <name>`). It MUST fail. Copy the failure message to `fails_before_fix`.
2. Run it repeatedly on the unfixed code (`-count=<user repeat count>` or the loop form from `race-stress-harness`). It must fail every run. A test that sometimes passes on unfixed code is not deterministic; return to Phase 2 and add the missing gate.
3. If the test passes on the unfixed code, the seam is not between the two accesses. Do not keep the test; fix the seam position.
4. Commit nothing yet. `race-apply-fix` commits the test (and hook) on its own before the first fix commit, so the failing state stays reachable for the before-and-after check.

### Output
`regression_test`.

### Quality Gate
- `fails_before_fix` is a copied failure message from step 1.
- The repeated run on unfixed code shows a failure in every run (failure count equals run count in the saved output).

---

## Worked Example

Illustrative only.

`root_cause`: `Store.stock` read at `reserve.go:47`, written at `reserve.go:51`; lost update.

Phase 1: steps (1) A reads, (2) B reads, (3) A writes, (4) B writes. No injected dependency between lines 47 and 51, so seam = test hook: `var testHookAfterRead = func() {}` called at line 48.

Phase 2: test sets the hook so the first caller signals `reached` and blocks on `release`; starts A, waits `reached`, runs B to completion with the hook disabled for B (hook checks an atomic call counter), closes `release`, waits A, asserts `if got := s.Stock("sku"); got != 98 { t.Fatalf("stock = %d, want 98", got) }`.

Phase 3: `go test -run '^TestReserveLostUpdate$' -count=1 ./inventory` prints `reserve_test.go:88: stock = 99, want 98`. With `-count=50`: `grep -c -- "--- FAIL"` prints 50.

---

## Exit Criteria

DONE when one gated test reproduces the root cause ordering, fails on every run of the unfixed code with a copied message, and contains no sleeps, skips, retries or tolerances.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Accesses are in third-party code | **Adjust**: put the seam at the in-repo call into the library, or fake the library interface. |
| Phase 2 | Test hangs because a gate is never released | **Retry**: check that every `reached` signal has a matching `release`; the framework timeout reports where it hung. |
| Phase 3 | Test passes on unfixed code | **Retry**: move the seam between the two accesses; do not keep a passing test as the regression test. |
| Phase 3 | Test fails only some runs on unfixed code | **Adjust**: a step is not gated; add a gate for it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
