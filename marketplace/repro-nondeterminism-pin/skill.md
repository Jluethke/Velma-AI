# Pin Nondeterminism in an Intermittent Repro

**One-line description:** Converts an intermittent reproduction into one that fails on every run by identifying and fixing each source of nondeterminism (random seeds, hash ordering, clock, time zone, scheduling, test order, network) with stack-specific switches, or passes an already deterministic repro through unchanged.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repro_script` (object, required): Output of `repro-deterministic-script`.
- `repro_rate` (object, required): Output of `repro-deterministic-script`.
- `stack` (string, required): One of `python`, `node`, `go`, `java`, `rust`, `cpp`.
- `confirm_runs` (integer, required): Number of runs used to confirm the result; a user input.

---

## Outputs

- `deterministic_repro` (object): The final script path and text, the pinned switches it sets (each with the source of nondeterminism it removes), and the new rate over `confirm_runs` runs.

---

## Phase 1: Pass-Through or Classify

### Entry Criteria
- `repro_rate.failures_with_signature` > 0.

### Actions
1. If `repro_rate.failures_with_signature` == `repro_rate.runs`, copy `repro_script` into `deterministic_repro` with an empty switch list and stop. Skip Phases 2 and 3.
2. Otherwise, collect two logs: one from a failing run and one from a passing run (rerun until you have both; save as `.repro/fail.log` and `.repro/pass.log`).
3. Diff them: `diff <(sed -E 's/[0-9]{2}:[0-9]{2}:[0-9]{2}[.0-9]*//g' .repro/pass.log) <(sed -E 's/[0-9]{2}:[0-9]{2}:[0-9]{2}[.0-9]*//g' .repro/fail.log) | head -50` (the `sed` strips wall-clock timestamps so they do not drown the diff).
4. Classify the first differing line with this table:

| First difference looks like | Likely source |
|---|---|
| Same items in different order (dict, set, map iteration, directory listing) | Hash or iteration ordering |
| Different random values, UUIDs, generated IDs | Unseeded random generator |
| Different dates, "today", expiry checks | Wall clock or time zone |
| Interleaved lines from threads or goroutines in different order | Scheduling / race |
| Different test names before the failure | Test order dependency |
| Timeouts, connection refused, DNS errors | Network or external service |

### Output
Pass-through `deterministic_repro`, or a classified source.

### Quality Gate
- Either `deterministic_repro` equals `repro_script` with rate == runs, or `.repro/fail.log` and `.repro/pass.log` both exist and the classification names one table row.

---

## Phase 2: Apply Stack-Specific Pins

### Entry Criteria
- A source is classified.

### Actions
1. Add exactly one pin at a time to the script (environment variable or flag only; no source edits), then rerun `confirm_runs` times. Use only the pins in this table:

| Source | python | node | go | java | rust | cpp |
|---|---|---|---|---|---|---|
| Hash ordering | `PYTHONHASHSEED=0` (string hashing in sets/dicts of str) | Object key order is deterministic by spec; sort the input listing instead | Map iteration is randomized by design; there is no switch. Record it as the cause; go to Phase 3 | `HashMap` order depends on `hashCode`; no switch. Record it | `HashMap` uses `RandomState`; no switch. Record it | `std::unordered_map` order is implementation-defined; record it |
| Random seed | If the code calls `random.seed()` from config, set it; for pytest use `pytest --randomly-seed=<seed>` (replays the seed printed in the failing run header) only if `pytest-randomly` is installed (check `pip show pytest-randomly`) | Inject via the app's seed config if present | `go test -shuffle=<seed>` for test order; app RNG needs a seed config | JUnit 5: `junit.jupiter.testmethod.order.default` in `junit-platform.properties` | `proptest`: `PROPTEST_CASES` and the seed printed in the failure; `quickcheck`: `QUICKCHECK_SEED` is not standard, check the crate docs | Seed config of the app |
| Clock / time zone | `TZ=<zone>`; freeze time in a test with `freezegun` or `time-machine` only if already a dependency | `TZ=<zone>`; `faketime` (libfaketime) on Linux: `faketime '2024-03-10 01:59:59' node app.js` | `TZ=<zone>`; `faketime` works only for cgo binaries, Go reads the clock through vDSO directly | `-Duser.timezone=<zone>` | `TZ=<zone>`; `faketime` | `TZ=<zone>`; `faketime` |
| Scheduling / race | `PYTHONFAULTHANDLER=1` for hang traces; run under `taskset -c 0` to force one CPU (Linux) | `UV_THREADPOOL_SIZE=1` | `GOMAXPROCS=1` to serialize, then `go test -race -count=<confirm_runs>` | `-XX:ActiveProcessorCount=1` | `RUST_TEST_THREADS=1` or `cargo test -- --test-threads=1` | `taskset -c 0`; build with `-fsanitize=thread` |
| Test order | `pytest -p no:randomly`; `pytest --lf` then bisect the order with `pytest-randomly` seed | `jest --runInBand`; `vitest --sequence.shuffle=false` | `go test -shuffle=off` then `-shuffle=<printed seed>` to replay | `mvn -Dsurefire.runOrder=alphabetical` | `--test-threads=1` | `ctest -j1`; `--gtest_shuffle --gtest_random_seed=<seed>` |
| Network | Point to a local stub; block egress with `--network none` in the replica | same | same | same | same | same |

2. For a race, also run the stack's race detector and record the first report: `go test -race`, `-fsanitize=thread` for C/C++/Rust nightly (`RUSTFLAGS=-Zsanitizer=thread`), Java has no built-in race detector (record "not available").
3. After each pin, record the new rate. Keep a pin only if the failure rate rises to every run, or it isolates the source (rate drops to zero when pinned one way and every run the other way).

### Output
Pinned script with per-pin evidence.

### Quality Gate
- Each kept pin shows a before rate and after rate from `confirm_runs` runs each.
- No source file in `repo_path` is modified (`git status --porcelain` shows only untracked `.repro/` or nothing).

---

## Phase 3: Force the Failing Branch

### Entry Criteria
- Pins applied but rate is still below every run, or the source has no switch (Go map order, Java `HashMap`, Rust `RandomState`).

### Actions
1. Shrink the input so the bad ordering or interleaving has fewer alternatives (for example two map keys instead of fifty). Rerun.
2. Wrap the run in a loop that stops at the first failure and keep the failing seed or log: `for i in $(seq 1 <confirm_runs>); do bash .repro/repro.sh && continue; echo "failed at $i"; break; done`.
3. If still intermittent, record the measured rate and the classified source as the cause; the regression test later must drive that branch directly (for example by constructing the input in the bad order) rather than relying on chance.

### Output
`deterministic_repro`.

### Quality Gate
- `deterministic_repro.rate` is printed from a real loop run, not estimated.
- If rate is below every run, the classified source and the forcing strategy are written down.

---

## Worked Example

Illustrative only. `stack` = python. `repro_rate` 7 of 20. Output diff shows a set of tag names printed in different order before a `KeyError`.

- Phase 1: classified as hash ordering.
- Phase 2: `PYTHONHASHSEED=0` gives 0 of 20; `PYTHONHASHSEED=3` gives 20 of 20. Pin kept: `PYTHONHASHSEED=3`; cause is iteration order over a `set` of strings.
- Phase 3: not needed. `deterministic_repro` = script with `export PYTHONHASHSEED=3`, rate 20 of 20.

---

## Exit Criteria

DONE when `deterministic_repro` fails on every run of `confirm_runs`, or the remaining nondeterminism is named with a forcing strategy for the test.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cannot get a passing run (all fail) | **Return**: it is already deterministic; pass through. |
| Phase 2 | Weak model adds `sleep` calls to source to widen a race | **Stop**: revert; sleeps in source hide the bug in the fix too. Use the race detector instead. |
| Phase 2 | A flag in the table is rejected by the installed tool version | **Adjust**: check `<tool> --help` and the official docs for the version in `env_snapshot`; do not guess a replacement flag. |
| Phase 3 | Rate stays low after all pins | **Adjust**: continue with a recorded rate and forcing strategy; the test must construct the failing order directly. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
