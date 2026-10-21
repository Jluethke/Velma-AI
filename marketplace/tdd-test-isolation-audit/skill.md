# TDD Test Isolation Audit

**One-line description:** Proves the tests written during TDD are independent and deterministic by running them in random order, repeatedly and in parallel with each runner's own flags, then finds and fixes the shared state behind any order-dependent failure.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `refactored_code` (object, required): Files and suite result from `tdd-refactor-under-green`.
- `test_runner` (string, required): One of `pytest`, `unittest`, `jest`, `vitest`, `go-test`, `cargo-test`, `junit5`.

---

## Outputs

- `isolation_report` (object): Commands run, seeds or orders used, pass/fail per run, every order-dependent test found with its root cause, and the fix applied.

---

## Phase 1: Static Smell Scan

### Entry Criteria
- Full suite green.

### Actions
1. Search the test files for patterns that cause order dependence or nondeterminism:

| Pattern | Search | Why it breaks isolation |
|---|---|---|
| Module-level mutable state | top-level `= []`, `= {}`, `let` outside `describe`, package-level `var` in `_test.go`, `static` non-final fields in test classes | one test's writes are seen by the next |
| Real sleep | `sleep(` | timing-dependent |
| Real time or random | `datetime.now`, `Date.now`, `time.Now`, `Math.random`, `new Random()` without seed | different value each run |
| Fixed file paths | `"/tmp/`, `"./out`, `"test.db"` | collisions between tests |
| Network | `http://`, `https://` hosts that are not a local fake | depends on outside systems |
| Missing teardown | `jest.useFakeTimers` without `useRealTimers`, `vi.stubEnv` without `unstubAllEnvs`, `setenv` without restore | leaks into later tests |

2. List each hit with file and line.

### Output
Smell list.

### Quality Gate
- The search was run over every test file in `refactored_code` and its hits (or "none") recorded.

---

## Phase 2: Random-Order, Repeat and Parallel Runs

### Entry Criteria
- Smell scan done.

### Actions
1. Run the suite with the runner's shuffle option. Record the seed it prints so a failure can be replayed:

| test_runner | Random order | Replay one order | Repeat | Parallel |
|---|---|---|---|---|
| pytest | install `pytest-randomly` (shuffles by default once installed) | `--randomly-seed=<n>` (or `--randomly-seed=last`); disable with `-p no:randomly` | `pytest-repeat`: `--count=<n>` | `pytest-xdist`: `-n auto` |
| unittest | not built in; run under pytest with `pytest-randomly` (pytest runs `TestCase` classes) | as pytest | loop in shell | not built in |
| jest | `--randomize` (Jest 29.2+) | `--seed=<n>` | loop in shell | default (workers); `--runInBand` for serial |
| vitest | `--sequence.shuffle` | `--sequence.seed=<n>` | loop in shell | default (threads/forks pool) |
| go-test | `-shuffle=on` | `-shuffle=<n>` | `-count=<n>` | `t.Parallel()` in tests; `-p` sets package parallelism |
| cargo-test | threads interleave by default; nightly only has `-Z unstable-options --shuffle` | rerun | loop in shell | default; `-- --test-threads=1` for serial |
| junit5 | config parameter `junit.jupiter.testmethod.order.default=org.junit.jupiter.api.MethodOrderer$Random` and `junit.jupiter.testclass.order.default=org.junit.jupiter.api.ClassOrderer$Random` in `src/test/resources/junit-platform.properties` | `junit.jupiter.execution.order.random.seed=<n>` | `@RepeatedTest(n)` on one test | `junit.jupiter.execution.parallel.enabled=true` |

2. The repeat count is a user input. If the user gives none, run random order with two different seeds and record that the repeat count was not specified.
3. A failure that happens only in some orders is order-dependent. A failure that happens on some repeats with the same order is nondeterministic (time, randomness, concurrency).

### Output
Run results with seeds.

### Quality Gate
- Every run's command, seed and exit code is recorded.
- Each failure is classified as order-dependent or nondeterministic.

---

## Phase 3: Find and Remove the Shared State

### Entry Criteria
- At least one failure, or Phase 1 hits. If both are empty, emit the report and finish.

### Actions
1. For an order-dependent failure, replay the failing seed, then bisect: run the failing test alone (passes?), then with each test that ran before it, halving the list until one "polluter" test remains. pytest users can install `detect-test-pollution` to automate this (check its README for usage).
2. Fix the polluter or the victim using this table:

| Root cause | Fix |
|---|---|
| Module or class level mutable state | create the state inside the test or in a per-test fixture (`function` scope in pytest, `beforeEach`, `@BeforeEach`) |
| Leaked env var, cwd, timer, mock | use the scoped tool that auto-restores (`monkeypatch`, `t.Setenv`, `vi.unstubAllEnvs`, `useRealTimers` in `afterEach`, `mockRestore`/`restoreAllMocks`) |
| Shared file or database row | per-test temp dir; per-test transaction rolled back in teardown |
| Real time, random or network | route through the seams from `tdd-time-boundary`, `tdd-randomness-boundary`, `tdd-http-boundary` |
| Test relies on an earlier test's output | make it arrange its own data |

3. Fix one cause at a time. After each fix, replay the failing seed and the full random-order run.
4. Do NOT fix by pinning an order (`@Order`, `pytest-order`, `--runInBand`, `--test-threads=1`) or by adding retries (`pytest-rerunfailures`, `jest.retryTimes`, `retry` in Vitest). Those hide the bug.

### Output
`isolation_report`.

### Quality Gate
- The previously failing seed now passes.
- A fresh random-order run with a new seed exits 0.
- `git diff` adds no ordering annotations or retry settings.

---

## Worked Example

Illustrative only. `test_runner` = `jest`.

Phase 1: `src/cart.test.ts` line 3: `const cart = new Cart();` at module level.
Phase 2: `npx jest --randomize` prints `Seed: 1043285117` and fails `removes an item` with `Expected: 0, Received: 1`. Rerun with `--seed=1043285117` reproduces.
Phase 3: `adds an item` (ran first) is the polluter. Move `cart` creation into `beforeEach(() => { cart = new Cart(); })`. `npx jest --seed=1043285117` passes; `npx jest --randomize` with a new seed passes.

---

## Exit Criteria

DONE when random-order runs with recorded seeds pass, every order-dependent or nondeterministic failure has a named root cause and fix, and no ordering or retry setting was added.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Shuffle plugin or flag unavailable in the installed version | **Adjust**: check `--help`; fall back to running test files in reversed order manually and record it. |
| Phase 2 | Failure appears even without shuffling | **Return**: it is a plain failing test; send it back to `tdd-green-minimal-code`. |
| Phase 3 | Polluter is in code the project does not own (global singleton in a library) | **Adjust**: reset it in a per-test teardown using the library's documented reset call; record it. |
| Phase 3 | Fix changes production behavior | **Stop**: write a red test for the behavior first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
