# Pytest-xdist Collision Fix

**One-line description:** Fixes tests that fail only under pytest-xdist because workers collide on the same files, ports, database names or cache keys, by scoping each resource to `worker_id` or `testrun_uid`, using `tmp_path_factory` with a file lock for once-per-session setup, and grouping truly serial tests with `xdist_group` and `--dist loadgroup`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_cause_evidence` (object, required): Evidence that failures appear only with `-n`.
- `flake_class` (string, required): Must be `parallel_collision`.
- `baseline_command` (string, required): The `-n` run that fails.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `py_xdist_fix_diff` (string): Unified diff with a note per hunk naming the resource now per-worker.

---

## Phase 1: Prove And Locate The Collision

### Entry Criteria
- `flake_class` is `parallel_collision`. Otherwise return an empty diff.

### Actions
1. Confirm worker dependence: run the same selection with `-p no:xdist` (or `-n 0`) for the same run count used for the baseline. Zero failures confirms it.
2. List shared resources the failing tests touch:
   `grep -rn -E "localhost:[0-9]+|127\.0\.0\.1:[0-9]+|/tmp/|tempfile\.gettempdir|NamedTemporaryFile\(delete=False|DATABASE_URL|dbname|redis://|bind\(\(|\.sqlite" tests/ conftest.py`
3. For each hit, record whether two workers could use the same value at the same time. A fixed port, fixed path, fixed database name, or fixed Redis db or key prefix is a collision.
4. Know xdist facts: each worker is a separate process named `gw0`, `gw1`, ...; the `worker_id` fixture returns that name, or `"master"` when xdist is not distributing; env var `PYTEST_XDIST_WORKER` holds the same name; `testrun_uid` is unique per pytest invocation and shared by its workers. A `scope="session"` fixture runs once per worker, not once per run.

### Output
Collision list.

### Quality Gate
- The `-n 0` run result is recorded with its counts.
- Each collision names the resource and the file:line that fixes its value.

---

## Phase 2: Make Each Resource Per-Worker

### Entry Criteria
- Collision list exists.

### Actions
1. Apply:

| Resource | Fix |
|---|---|
| Fixed port | Bind to port 0 and read the assigned port (`sock.bind(("127.0.0.1", 0)); port = sock.getsockname()[1]`), or pass port 0 to the server and read it back |
| Fixed temp path | `tmp_path` / `tmp_path_factory` (pytest makes them unique per worker) |
| Shared database | Name per worker: `f"test_{worker_id}"` in a session fixture that creates and drops it; pytest-django already suffixes test database names with the worker id under xdist |
| Shared Redis | Key prefix `f"{testrun_uid}:{worker_id}:"` or a distinct logical db per worker |
| Once-per-run setup (build assets, start a container) | Session fixture that uses `tmp_path_factory.getbasetemp().parent` as a shared directory plus `filelock.FileLock` around the work, writing a marker file, as shown in the pytest-xdist docs "Making session-scoped fixtures execute only once" |
| Tests that must not run concurrently (exclusive hardware, global external account) | `@pytest.mark.xdist_group(name="serial_x")` and run with `--dist loadgroup` so the group runs on one worker |

2. Do NOT add `-p no:xdist` or `-n 0` to CI as the fix. Do NOT add `@pytest.mark.xdist_group` to tests that only need unique names; grouping hides the collision instead of removing it.
3. One resource at a time; rerun `baseline_command` once after each.

### Output
Edited fixtures and tests.

### Quality Gate
- `grep` from Phase 1 action 2 shows no remaining fixed port, path or database name in the failing tests' fixtures.
- `baseline_command` passes once.

---

## Phase 3: Stress Workers And Diff

### Entry Criteria
- Resources per-worker.

### Actions
1. Run with the CI worker count and with the machine's CPU count: `python -m pytest <selection> -n auto -q` and `-n <CI value>`.
2. Run with `--dist loadfile` and `--dist load` once each: different distributions put different tests side by side.
3. `git -C <repo_path> diff > flk-xdist.diff`; copy into `py_xdist_fix_diff`; delete it.

### Output
`py_xdist_fix_diff`.

### Quality Gate
- All runs in actions 1 and 2 exit 0, counts recorded.

---

## Worked Example

Illustrative. `tests/integration/test_webhooks.py`, server fixture binds `localhost:8099`.

- Phase 1: `-n 0` loop 0/112 failures; `-n auto` 9/112 with `OSError: [Errno 98] Address already in use`. Collision: fixed port at `conftest.py:31`.
- Phase 2: fixture starts the server on port 0 and yields `f"http://127.0.0.1:{server.server_port}"`.
- Phase 3: `-n auto` and `-n 4` both `212 passed`; `--dist loadfile` `212 passed`.

---

## Exit Criteria

DONE when every collision resource is unique per worker or grouped for a documented exclusive reason, and multi-worker runs under two distributions exit 0.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Failures persist with `-n 0` | **Return**: not a worker collision; back to the classifier. |
| Phase 2 | External service allows only one client | **Adjust**: `xdist_group` for those tests with a comment naming the constraint. |
| Phase 3 | `filelock` not installed | **Adjust**: add it as a test dependency in the existing dev requirements file. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
