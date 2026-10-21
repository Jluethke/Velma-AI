# pytest-playwright Parallel Runs with pytest-xdist and CI Splitting with pytest-split

**One-line description:** Runs Python Playwright tests in parallel processes with `pytest -n` from pytest-xdist (each worker gets its own browser), picks `--dist` mode by fixture cost, and splits the suite across CI machines with pytest-split using a committed `.test_durations` file.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `pw_py_config` (object, required): From `e2e-py-pw-setup`.
- `shard_count` (integer, optional): Number of CI machines. When absent, 1.

---

## Outputs

- `py_shard_plan` (object): `{workers_flag, dist_mode, shard_count, split_command, durations_file, isolation_proof, timing_before, timing_after}`.

---

## Phase 1: Parallel Workers on One Machine

### Entry Criteria
- The data seeding flow passed its double parallel run.

### Actions
1. Install `pytest-xdist` with the project tool.
2. Run `pytest e2e -n auto` (`auto` = one worker per CPU core reported by the OS). Then `pytest e2e -p no:xdist`. Both must pass.
3. Choose `--dist`:

| Situation | `--dist` |
|---|---|
| Tests are independent, function-scoped data | `load` (default) |
| A module- or class-scoped fixture is expensive (seeded catalog per module) | `loadscope` (keeps a module's tests on one worker so the fixture runs once) |
| Tests in a file must share one browser context in order | `loadfile`, and record why |

4. Session-scoped fixtures run once per worker, not once per run. Expensive one-time work needs the FileLock pattern (see the Python auth flow).

### Output
Worker settings.

### Quality Gate
- Both runs in step 2 pass.
- The chosen `--dist` cites its row.

---

## Phase 2: Measure and Fix the Worker Count for CI

### Entry Criteria
- Local parallel runs pass.

### Actions
1. In CI, print `nproc` and run with `-n auto` and with `-n 1`; record durations and failures.
2. If `-n auto` fails and `-n 1` passes, it is a collision or resource issue: return to data isolation, or test `-n <nproc/2>` and record the reason.
3. Put `-n` in the CI command, not in `addopts`, so local debug runs with `--pdb` stay single-process (`--pdb` does not work under xdist).

### Output
`workers_flag`.

### Quality Gate
- Two CI runs with the chosen `workers_flag` pass; durations recorded.

---

## Phase 3: Split Across Machines with pytest-split

### Entry Criteria
- `shard_count` > 1, otherwise finish.

### Actions
1. Install `pytest-split`. Generate timings once: `pytest e2e --store-durations` writes `.test_durations` at the rootdir. Commit it.
2. In CI matrix job `i` of `n` (1-based): `pytest e2e --splits <n> --group <i> -n auto`. pytest-split balances groups by the stored durations; tests missing from the file get the average duration.
3. Verify coverage: for each group run `pytest e2e --splits <n> --group <i> --collect-only -q | tail -1`; the counts must add up to `pytest e2e --collect-only -q | tail -1`.
4. Regenerate `.test_durations` when tests are added in bulk; stale timings only unbalance groups, they never drop tests.
5. Check `pytest --help | grep -A1 splits` for the exact flags of the installed version.

### Output
`py_shard_plan`.

### Quality Gate
- Group collection counts sum to the full collection count.
- Each matrix job uploads its own JUnit file (`--junitxml=results-<i>.xml`).

---

## Worked Example

Illustrative only. `shard_count=2`, 30 tests.
```
$ pytest e2e -n auto -q | tail -1
30 passed in 41.2s
$ pytest e2e --store-durations -q | tail -1
30 passed in 132.8s
$ pytest e2e --splits 2 --group 1 --collect-only -q | tail -1
16 tests collected
$ pytest e2e --splits 2 --group 2 --collect-only -q | tail -1
14 tests collected
```
CI wall time: 4m02s to 2m15s (runs 211 and 219).

---

## Exit Criteria

DONE when the suite passes both single-process and with xdist, the `--dist` mode and CI worker count are justified, and split groups add up to the full suite.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ScopeMismatch` or fixtures run more than expected | **Adjust**: session fixtures are per worker; use the FileLock pattern. |
| Phase 2 | Failures only under `-n auto` | **Stop**: shared state; fix isolation before raising workers. |
| Phase 3 | `unrecognized arguments: --splits` | **Adjust**: pytest-split is not installed in the CI environment. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
