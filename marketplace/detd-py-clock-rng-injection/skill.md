# Python Clock and RNG Injection

**One-line description:** Replaces every direct clock read, global random call, uuid call and unordered set iteration on the Python decision path with an injected `Clock` protocol and a seeded `random.Random` or `numpy.random.Generator`, then bans the direct calls with Ruff rule TID251 so they cannot come back.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `nondeterminism_sources` (object[], required): Rows from `detd-nondeterminism-inventory` with `reaches_decision` of yes or unknown.

---

## Outputs

- `injection_patch` (string): Path to the patch file (`git diff > detd_injection.patch`) containing the seam changes.
- `seam_tests` (string[]): Test node ids (for example `tests/test_seams.py::test_same_seed_same_output`) that prove the seams work.

---

## Phase 1: Define the Seams

### Entry Criteria
- `nondeterminism_sources` contains at least one python row with category clock, rng, identity or hash_order.
- `pytest --version` and `ruff --version` both print versions.

### Actions
1. Create one module, for example `planner/seams.py`, holding:
   - `class Clock(typing.Protocol): def now_ns(self) -> int: ...`
   - `class MonotonicClock: def now_ns(self) -> int: return time.monotonic_ns()` for production.
   - `class FakeClock: __init__(self, start_ns: int)`, `now_ns()` returns the stored value, `advance(ns: int)` adds to it.
2. Use integer nanoseconds (`time.monotonic_ns()`), not float seconds from `time.time()`: float seconds lose sub-microsecond resolution at current epoch values and differ in the last bits after arithmetic.
3. Use `time.monotonic_ns()` for durations and deadlines. Use wall time (`time.time_ns()`) only where the decision truly needs calendar time, and inject it through the same protocol under a different name.
4. RNG: the decision code receives one generator instance. Standard library: `random.Random(seed)`. NumPy: `numpy.random.default_rng(seed)` which returns a `Generator` backed by PCG64. Never call module level `random.random()` or `np.random.seed()`; both use hidden global state shared with every library in the process.
5. Identity: replace `uuid.uuid4()` with an injected id factory (a counter, or `uuid.UUID(int=rng.getrandbits(128), version=4)` from the injected `random.Random`).

### Output
`seams.py` with protocol, production and fake implementations.

### Quality Gate
- `python -c "import planner.seams"` exits 0.
- `rg -n 'time\.time\(|random\.random\(|np\.random\.seed' planner/seams.py` finds no hits except inside `MonotonicClock`.

---

## Phase 2: Thread the Seams Through the Decision Path

### Entry Criteria
- Seams module exists.

### Actions
1. Edit ONE call site at a time, in the order of `nondeterminism_sources`. After each edit run the existing test suite (`pytest -q`). Do not edit many files and run tests once at the end.
2. Pass `clock` and `rng` as constructor arguments of the decision object, or as parameters of the step function. Do not read them from a module global or a singleton.
3. Read the clock ONCE per decision tick at the top of the step and pass the value down as `now_ns`. Multiple reads in one tick make the result depend on how long the tick took.
4. Hash order: replace `for x in some_set:` with `for x in sorted(some_set):` when the loop affects output order or accumulates floats. String hashing is randomized per process unless `PYTHONHASHSEED` is set; `dict` keeps insertion order (guaranteed since Python 3.7), so dicts built in a deterministic order iterate deterministically.
5. Legacy tests that patch time may keep `freezegun.freeze_time`, but production code paths must use the injected clock; freezegun does not cover C extensions that read the clock directly.

### Output
Decision path edited; every reachable source row marked fixed with the commit or patch hunk.

### Quality Gate
- `pytest -q` exits 0 after the last edit, and the count of passed tests is not lower than before Phase 2 (compare the summary line).
- No test was deleted, skipped or had an assertion weakened: `git diff --stat tests/` shows only additions or the seam constructor arguments.

---

## Phase 3: Ban and Prove

### Entry Criteria
- Phase 2 tests pass.

### Actions
1. Add to `pyproject.toml`:
   ```
   [tool.ruff.lint]
   extend-select = ["TID251"]
   [tool.ruff.lint.flake8-tidy-imports.banned-api]
   "time.time".msg = "Use the injected Clock"
   "time.monotonic".msg = "Use the injected Clock"
   "datetime.datetime.now".msg = "Use the injected Clock"
   "random.random".msg = "Use the injected random.Random"
   "uuid.uuid4".msg = "Use the injected id factory"
   ```
   Add a per-file ignore for `planner/seams.py` under `[tool.ruff.lint.per-file-ignores]`.
2. Run `ruff check planner/` and confirm it exits 0.
3. Write `tests/test_seams.py` with: `test_same_seed_same_output` (two decision objects, same `FakeClock` start and seed, same inputs, outputs equal with `==` on the serialized bytes), and `test_different_seed_changes_rng_draws` (proves the seed is actually used).
4. Mutation check: temporarily add `x = time.time()` in one decision module, run `ruff check`, confirm a TID251 error is reported, then remove the line with `git restore <file>`.
5. Save the patch: `git diff > detd_injection.patch`.

### Output
`injection_patch`, `seam_tests`.

### Quality Gate
- `ruff check planner/` exits 0 on the final tree and reported TID251 during the mutation check.
- `pytest -q tests/test_seams.py` passes both tests.
- `git status --porcelain` shows no leftover mutation.

---

## Worked Example

Illustrative only. Source row `planner/limits.py:58 stamp = time.time()`.

Phase 1: `seams.py` created. Phase 2: `check_limits(state, inputs)` becomes `check_limits(state, inputs, now_ns)`, and `decide_step` reads `now_ns = self.clock.now_ns()` once. `pytest -q` prints `142 passed in 3.1s`, same as before.

Phase 3: mutation run prints `planner/limits.py:3:5: TID251 time.time is banned: Use the injected Clock`. After `git restore`, `ruff check planner/` prints `All checks passed!`.

---

## Exit Criteria

DONE when every reachable python source row is fixed, Ruff bans the direct calls, the seam tests pass, and the patch file exists.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Ruff not installed | **Adjust**: `pip install ruff`; record the version. |
| Phase 2 | A third party library reads the clock internally | **Adjust**: wrap the library call behind the seam, or record the row as an open item; do not monkeypatch the library globally in production. |
| Phase 2 | Tests fail after an edit | **Retry**: revert that one edit with `git restore`, redo it; never weaken the failing test. |
| Phase 3 | Mutation check shows no TID251 error | **Stop**: the ban config is not active; check `ruff check --show-settings` for `flake8-tidy-imports`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
