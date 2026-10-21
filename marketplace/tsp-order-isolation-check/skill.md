# Test Order and Isolation Check

**One-line description:** Confirms the stack's new parallel command is safe by running it repeatedly with randomized order and recorded seeds (pytest-randomly `--randomly-seed`, Jest `--randomize --seed`, Vitest `--sequence.shuffle --sequence.seed`, Go `-shuffle`), reproduces any failure from its seed, and emits the one verified `parallel_command` the rest of the chain uses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `stack` (string, required): `python`, `node` or `go`.
- `repo_path` (string, required): Repository root.
- `run_count` (integer, required): Number of randomized runs; the same value used for the baseline.
- `py_parallel_command` (object, optional): From `tsp-py-xdist-parallel` when `stack` is `python`.
- `node_parallel_command` (object, optional): From `tsp-node-worker-tuning` when `stack` is `node`.
- `go_parallel_command` (object, optional): From `tsp-go-parallel-flags` when `stack` is `go`.

---

## Outputs

- `parallel_command` (string): The verified command line for the full suite (including any separate serial step), stack-neutral for later flows.
- `isolation_report` (object): Every run's seed and result, each order-dependent failure with its reproducing seed and the minimal pair of tests, and the fix commit or the open defect.

---

## Phase 1: Randomized Runs

### Entry Criteria
- The `*_parallel_command` for `stack` is present.

### Actions
1. Select the command and the randomization flags:

| `stack` | Plugin or flag | Run form | Where the seed is printed |
|---|---|---|---|
| python | `pytest-randomly` (install as dev dependency) | `<cmd> -p randomly --randomly-seed=<n>` | Header line `Using --randomly-seed=<n>` |
| node (Jest 29.2+) | built in | `<cmd> --randomize --seed=<n>` | `Seed: <n>` in the summary when `--showSeed` or `--randomize` is passed |
| node (Vitest) | built in | `<cmd> --sequence.shuffle --sequence.seed=<n>` | The seed you passed |
| go 1.17+ | built in | `<cmd> -shuffle=<n>` | `-test.shuffle <n>` at the top of each package output |

2. Generate `run_count` seeds up front (for example `for i in $(seq 1 <run_count>); do echo $RANDOM$RANDOM; done > seeds.txt`) so every run is reproducible.
3. Run the parallel command once per seed and record pass or fail per seed. Python: pytest-randomly also reseeds `random`, Faker and numpy per test, which can expose hidden seed dependencies; record those separately as data-randomness failures.

### Output
Seed list with results.

### Quality Gate
- `seeds.txt` has `run_count` lines and each has a recorded result copied from the run summary.

---

## Phase 2: Reproduce and Minimize Failures

### Entry Criteria
- At least one failing seed; otherwise skip to Phase 3.

### Actions
1. Re-run the failing seed serially to separate order dependence from parallel races: python `<cmd> -n 0 -p randomly --randomly-seed=<n>`; Jest `--runInBand --randomize --seed=<n>`; Vitest `--no-file-parallelism --sequence.shuffle --sequence.seed=<n>`; Go `-p 1 -parallel 1 -shuffle=<n>`.

| Serial rerun | Diagnosis |
|---|---|
| Fails | Order dependence: a test relies on state left by another |
| Passes | Parallel interference: shared resource across workers or `t.Parallel()` tests |

2. Order dependence: find the polluting test. python: rerun the seed with `-v` to print the order; bisect the list of tests that ran before the failing test in that worker (from `-v` output) by running halves with the failing test last, `pytest <subset> <failing> -p no:randomly -n 0`. Node and Go: same halving with explicit file lists or `-run` regexes.
3. Fix the polluter or the victim in one commit (reset the global in teardown, use per-test temp dirs, restore mocks with `jest.restoreAllMocks()`/`vi.restoreAllMocks()` or `monkeypatch`). Do NOT pin test order, disable randomization, or mark the test skip/flaky.
4. Parallel interference: return to the stack's parallel flow with the shared resource named.

### Output
Minimal pairs, fixes or open defects.

### Quality Gate
- Each failure has a reproducing seed and a minimal pair or a named shared resource.
- After each fix, the failing seed passes.

---

## Phase 3: Emit the Verified Command

### Entry Criteria
- All seeds pass, or every remaining failure is an open defect the user accepted.

### Actions
1. Rerun all seeds from `seeds.txt` once more after the last fix; all must pass.
2. Write `parallel_command` as the literal command line, including any serial step (for example `pytest -n 8 --dist loadfile -m "not serial" && pytest -m serial -p no:xdist`).
3. Keep randomization on in CI if the user agrees: pytest-randomly is active by default once installed; Jest needs `--randomize` or `randomize: true` in config; Vitest `sequence: { shuffle: true }`; Go `-shuffle=on`. Log the seed in CI output so failures reproduce.

### Output
`parallel_command`, `isolation_report`.

### Quality Gate
- Final rerun of every seed passes, with results recorded.
- `parallel_command` runs as written from a fresh shell and exits 0.

---

## Worked Example

Illustrative. `stack=python`, `run_count=5`, command `pytest -n 8 --dist loadfile`.

- Phase 1: seeds 1-4 pass; seed `2611904371` fails `tests/api/test_settings.py::test_default_currency` (`assert 'EUR' == 'USD'`).
- Phase 2: serial rerun with `-n 0` fails too: order dependence. Halving finds `tests/admin/test_currency.py::test_switch_currency` sets `settings.CURRENCY = "EUR"` without restoring. Fix: use `monkeypatch.setattr(settings, "CURRENCY", "EUR")`. Seed `2611904371` now passes.
- Phase 3: all 5 seeds pass. `parallel_command` = `pytest -n 8 --dist loadfile`.

---

## Exit Criteria

DONE when every seeded run passes (or failures are accepted open defects with seeds), and `parallel_command` is a literal, rerunnable command line.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Jest older than 29.2 rejects `--randomize` | **Adjust**: record that order randomization is unavailable for this version and rely on repeated parallel runs; recommend the upgrade. |
| Phase 2 | Failure does not reproduce with the same seed | **Adjust**: the failure is timing based, not order based; hand it to a flaky-test workflow with the seed and log. |
| Phase 2 | Polluter is in third-party code (global registry) | **Adjust**: reset the registry in an autouse fixture or `afterEach`, citing the library's reset API. |
| Phase 3 | User does not want randomization in CI | **Return**: record the decision; the verified command stands. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
