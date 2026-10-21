# Pytest Parallel Runs with pytest-xdist

**One-line description:** Runs a pytest suite across processes with pytest-xdist (`-n`, `--dist load|loadscope|loadfile|loadgroup|worksteal`), makes session resources worker-safe with the `worker_id` fixture, `PYTEST_XDIST_WORKER` and a `filelock`-guarded shared setup, groups tests that must share a worker with `xdist_group`, and picks worker count and distribution mode from measured runs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `test_command` (string, required): Baseline pytest command.
- `hotspot_plan` (object, required): From `tsp-hotspot-classify`; sleep, network and database items should be `done` before this runs.

---

## Outputs

- `py_parallel_command` (object): The chosen command (for example `pytest -n 8 --dist loadfile`), pytest-xdist version, measured wall times per candidate, worker-safety changes made (with commits), tests grouped with `xdist_group`, and tests that still require serial execution.

---

## Phase 1: First Parallel Run

### Entry Criteria
- `hotspot_plan` has no `todo` items of class sleep, network or database, or the user accepts running with them open.

### Actions
1. Install as a dev dependency if missing: `pip install pytest-xdist` (add to the project's dev requirements file in the same commit). Check: `pytest --version` lists `xdist` in plugins with `pytest -VV` or `pytest -v` header.
2. Run: `<test_command> -n auto -p no:randomly -q`. `-n auto` starts one worker per CPU (`-n logical` counts logical CPUs and needs `psutil`; check `pytest --help | grep -A3 "\-n "` for your version).
3. Read failures. Typical failure causes under xdist:

| Symptom | Cause | Fix |
|---|---|---|
| Unique violations, "database already exists", row counts off | Workers share one DB | Per-worker database name from the `worker_id` fixture (`"gw0"`, `"gw1"`; `"master"` without xdist) |
| `FileExistsError`, files overwritten | Hard-coded paths like `/tmp/out.json` | Use `tmp_path` per test or `tmp_path_factory` |
| Port already in use | Fixed port numbers | Bind port 0 and read the assigned port |
| Expensive session fixture runs N times | Session fixtures are per worker | Shared-once pattern below |
| Test passes alone, fails in parallel, and touches a module-level global | Shared in-process state that previously leaked between tests in order | Fix the test isolation (reset in fixture); do not serialize it silently |

4. Shared-once pattern from the pytest-xdist docs: in the session fixture, if `worker_id == "master"` build directly; else use `root = tmp_path_factory.getbasetemp().parent`, a `FileLock(str(root / "data.json") + ".lock")` from the `filelock` package, and build only when `root / "data.json"` does not exist, otherwise read it.
5. Fix one cause per commit and rerun the full parallel suite after each.

### Output
A green `-n auto` run, worker-safety commits.

### Quality Gate
- `-n auto` run ends with `passed` and zero `failed`.
- Each safety commit changes one fixture or one test file (`git show --stat`).

---

## Phase 2: Pick Distribution Mode and Worker Count

### Entry Criteria
- `-n auto` green.

### Actions
1. Choose candidate modes:

| Suite trait | Candidate `--dist` |
|---|---|
| Default, independent tests | `load` (default when `-n` is given) |
| Expensive module- or class-scoped fixtures | `loadscope` (groups by module, and by class for test methods) or `loadfile` (groups by file) |
| Some tests must share one worker (one external resource) | `loadgroup` with `@pytest.mark.xdist_group(name="<resource>")` on those tests |
| Very uneven test durations | `worksteal` (pytest-xdist 3.2+; check `pytest --help`) |

2. Candidate worker counts: the CPU count, half the CPU count, and the count CI runners have (from the CI runner spec). Do not try counts above the CPU count unless tests are I/O-bound by the hotspot classes; then also try twice the CPU count.
3. Time each combination with hyperfine: `hyperfine --runs <runs used in baseline_report> --export-json xdist.json '<test_command> -n 4 --dist load -q' '<test_command> -n 8 --dist loadfile -q' ...`.
4. Pick the combination with the lowest median whose max is below the max of every other combination. If ranges overlap, pick the one with fewer workers (less memory and DB load) and record that results were not separable.

### Output
Chosen command with its timing evidence.

### Quality Gate
- `xdist.json` holds every candidate; the chosen one's median and max are quoted.

---

## Phase 3: Coverage, Config and Serial Remainder

### Entry Criteria
- Command chosen.

### Actions
1. Coverage under xdist: pytest-cov combines worker data automatically. Run `<chosen command> --cov=<pkg> --cov-report=term` and compare `TOTAL` covered with `coverage_baseline` from `tsp-baseline-lock`. They must match when no tests changed.
2. Tests that truly cannot run in parallel (single hardware device, global OS state): mark them `@pytest.mark.serial` (register the marker in config) and run them in a second step `pytest -m serial -p no:xdist` while the main run uses `-m "not serial" -n <N>`. Record each with its reason.
3. Put the flags in config only after the user agrees: `addopts = "-n 8 --dist loadfile"` in `[tool.pytest.ini_options]`. Note this makes `pytest -k x` start workers too; developers can pass `-n 0` to disable.
4. Do NOT add `@pytest.mark.serial` to make a failing test pass without a stated reason that names the shared resource.

### Output
`py_parallel_command`.

### Quality Gate
- Coverage covered count under xdist equals the serial covered count for the same commit.
- Every `serial` test has a named shared resource.

---

## Worked Example

Illustrative. 8 CPUs; CI runner has 4.

- Phase 1: `pytest -n auto` fails 6 tests with `database "shop_test" already exists`; fixed by `f"shop_test_{worker_id}"` in the engine fixture. Rerun: `412 passed`.
- Phase 2: hyperfine medians: `-n 8 --dist load` 19.8 s, `-n 8 --dist loadfile` 15.1 s, `-n 4 --dist loadfile` 22.6 s. Chosen `-n 8 --dist loadfile` locally; CI uses `-n 4 --dist loadfile`.
- Phase 3: covered 5408 serial and 5408 under xdist. One test, `test_usb_printer`, marked `serial` (shares `/dev/usb/lp0`).

---

## Exit Criteria

DONE when a green parallel command is chosen from recorded timings, coverage matches the serial run, and every serial exception names its shared resource.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Workers crash with `node down` | **Adjust**: a test kills or exhausts the process (memory, `os._exit`); run it alone with `-n 0` and fix, or use `--max-worker-restart` per docs while fixing. |
| Phase 1 | Output order makes failures hard to read | **Adjust**: rerun the failing test with `-n 0 -x` to see a serial trace. |
| Phase 2 | Parallel slower than serial | **Return**: per-worker session setup dominates; run `tsp-py-setup-import-cost` and `tsp-pg-template-clone` first. |
| Phase 3 | Coverage lower under xdist | **Adjust**: subprocess or thread coverage not collected; check `[tool.coverage.run] concurrency` and `parallel` settings in coverage docs. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
