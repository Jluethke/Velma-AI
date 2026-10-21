# Pytest Order Pollution Bisect

**One-line description:** Detects whether a pytest test fails only after certain other tests by replaying shuffled orders with pytest-randomly seeds, then names the exact polluting test with detect-test-pollution and confirms it with a two-test run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flake_evidence` (object, required): Supplies `test_id` and the CI test selection.
- `py_flake_rate_report` (object, required): From `flk-py-repeat-measure`; tells whether the test fails alone.
- `repeat_count` (integer, required): Number of shuffled orders to try.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `py_order_report` (object): `{order_dependent: true|false, failing_seeds[], passing_seeds_sample[], polluter_test_id, two_test_repro_command, victim_alone_passes, polluter_mechanism_hint}`.

---

## Phase 1: Shuffle And Record Seeds

### Entry Criteria
- `py_flake_rate_report` shows in-process and fresh-process rates of 0 or near the CI rate; this flow runs either way because order dependence can stack on top of other causes.

### Actions
1. Install: `python -m pip install pytest-randomly`. When installed it is on by default and prints `Using --randomly-seed=<n>` at the top of each session.
2. Run the CI selection that contains `test_id` (for example `tests/api`) once per seed, with seeds 1 to `repeat_count` so they are reproducible:
   `for s in $(seq 1 <repeat_count>); do python -m pytest tests/api -p randomly --randomly-seed=$s -p no:xdist -q --junitxml="flk-seed-$s.xml" > /dev/null 2>&1; if grep -A2 'name="<test_function>"' "flk-seed-$s.xml" | grep -q -E '<failure|<error'; then echo "FAIL $s"; fi; done`
3. Keep `-p no:xdist` here: with workers, the order each worker sees is not the printed order, and collisions are a different class handled by `flk-py-xdist-collision-fix`.
4. Record every failing seed. Replay one: `python -m pytest tests/api -p randomly --randomly-seed=<failing seed> -p no:xdist -q`. It must fail again; a seed that does not replay means the failure is not order-driven at that seed.
5. Know what pytest-randomly also does: it resets `random.seed()` (and NumPy, Faker and factory_boy seeds when installed) to the session seed before each test. A test that started passing under randomly may have been randomness-driven, not order-driven. Note it in `polluter_mechanism_hint`.
6. Flags exist to separate the two effects: `--randomly-dont-reorganize` keeps order but still reseeds; `--randomly-dont-reset-seed` shuffles but does not reseed. Use them to decide which effect matters.

### Output
Failing and passing seeds.

### Quality Gate
- At least one failing seed replays to a failure on two consecutive runs, or `order_dependent` is set to false with the full seed range listed.

---

## Phase 2: Find The Polluter

### Entry Criteria
- A replaying failing seed exists.

### Actions
1. Write the test ids that ran before `test_id` in the failing order: `python -m pytest tests/api -p randomly --randomly-seed=<seed> -p no:xdist --co -q > flk-order.txt`. Keep only lines up to and including `test_id`.
2. Install and run the bisector: `python -m pip install detect-test-pollution`, then
   `detect-test-pollution --failing-test "<test_id>" --testids-file flk-order.txt`
   (or `--tests tests/api` to let it collect). It repeatedly halves the candidate list and runs pytest. Check `detect-test-pollution --help` for flags in your installed version.
3. Read the final lines of its output: it reports the single test id that makes `test_id` fail when run before it.
4. If the tool is unavailable, bisect by hand: split the ids before `test_id` into halves, run `python -m pytest -p no:randomly <half> "<test_id>"`, keep the half that fails, repeat until one id remains. pytest runs ids in the order given on the command line when `-p no:randomly` is set.

### Output
`polluter_test_id`.

### Quality Gate
- The bisection log or tool output names one test id.

---

## Phase 3: Confirm And Characterize

### Entry Criteria
- `polluter_test_id` named.

### Actions
1. Confirm with exactly two tests: `python -m pytest -p no:randomly "<polluter_test_id>" "<test_id>"` fails, and `python -m pytest -p no:randomly "<test_id>" "<polluter_test_id>"` passes. Record the failing line as `two_test_repro_command`.
2. Read the polluter's source and fill `polluter_mechanism_hint` from this table:

| Seen in polluter | Mechanism |
|---|---|
| Assigns a module attribute or global without `monkeypatch` | leaked module state |
| `os.environ[...] =` without restore | leaked environment |
| `@functools.lru_cache` / `functools.cache` on a called function | cached result from earlier inputs |
| Writes to a fixed path (not `tmp_path`) | leaked file |
| Commits to a database without rollback | leaked rows |
| `mock.patch(...).start()` without `.stop()` | leaked patch |
| Changes `logging` config, `locale.setlocale`, `os.chdir`, `sys.path` | leaked process setting |
| Fixture with `scope="module"` or `"session"` that the polluter mutates | shared fixture object |

3. Do NOT fix by reordering tests, by pinning a seed in CI, or by marking the victim `skip`. The polluter leaks state; the fix belongs in the polluter or the shared fixture.
4. Delete `flk-*.xml` and `flk-order.txt`.

### Output
`py_order_report`.

### Quality Gate
- Two-test run fails in polluter-first order and passes in victim-first order, both outputs recorded.

---

## Worked Example

Illustrative. `test_id` = `tests/api/test_orders.py::test_refund_total`, `repeat_count` = 112.

- Phase 1: seeds 7, 33, 61, 90 fail. `--randomly-seed=33` replays to a failure twice.
- Phase 2: `detect-test-pollution --failing-test tests/api/test_orders.py::test_refund_total --testids-file flk-order.txt` narrows 214 ids to `tests/api/test_pricing.py::test_eur_rounding_mode`.
- Phase 3: polluter-first run fails with `assert Decimal('9.99') == Decimal('10.00')`; reverse order passes. Polluter calls `decimal.getcontext().rounding = ROUND_DOWN` with no restore: leaked process setting.

---

## Exit Criteria

DONE when `py_order_report` either names a confirmed polluter with a two-test reproduction, or states `order_dependent: false` with the seed range tried.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No failing seed in the range | **Return**: `order_dependent: false`; the classifier uses other evidence. |
| Phase 1 | Failing seed does not replay | **Adjust**: the failure is not order-only; record the seed and continue to the classifier with it. |
| Phase 2 | Bisection ends with no single polluter | **Adjust**: pollution needs two tests together; bisect pairs from the last half that failed and record both ids. |
| Phase 3 | Two-test run passes both ways | **Retry**: rerun each order `repeat_count` times; if still both pass, report order dependence as unconfirmed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
