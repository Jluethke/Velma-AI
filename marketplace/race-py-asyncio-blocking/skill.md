# Python asyncio Blocking Call Removal Plan

**One-line description:** Finds every blocking call made inside `async def` code (sleep, sync HTTP, sync database drivers, file I/O, subprocess, CPU-heavy work, sync locks), confirms which ones stall the event loop, and assigns each the specific async replacement or offload API.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root.
- `py_asyncio_debug_findings` (object[], required): From `race-py-asyncio-debug`; slow-callback rows point at the coroutines to inspect first.

---

## Outputs

- `py_blocking_calls` (object[]): One row per blocking call: `location` (file:line), `call` (source text), `category` (from the replacement table), `confirmed_by` (`slow-callback`, `ruff`, `grep`), `replacement` (exact async API or offload call), `notes`.

---

## Phase 1: Find Candidates

### Entry Criteria
- The project has `async def` functions.

### Actions
1. Static rule check, if ruff is installed: `ruff check --select ASYNC --output-format concise "<repo_path>" > /tmp/ruff_async.txt`. The `ASYNC` rules come from flake8-async and flag blocking HTTP, subprocess, `open()` and `time.sleep` inside async functions. Run `ruff rule --all | grep ASYNC` (or `ruff rule <code>`) to see which codes your version has; do not cite a code you did not see there.
2. Grep for blocking calls in the same files as async functions:
   `rg -n "time\.sleep\(|requests\.(get|post|put|patch|delete|head|request)\(|urllib\.request|urlopen\(|subprocess\.(run|call|check_call|check_output|Popen)\(|open\(|psycopg2|pymysql|mysql\.connector|sqlite3\.connect|redis\.Redis\(|boto3\.|threading\.Lock\(|\.result\(\)|socket\.socket\(" --type py "<repo_path>"`
3. For each grep hit, keep it only if it executes on the event loop: it is inside an `async def` body, or inside a sync function that an `async def` calls directly (follow one call level with `rg -n "<function>\("`). Drop hits only reachable from threads or startup code, with a reason.
4. Add each `slow-callback` row from `py_asyncio_debug_findings`: open the named coroutine and list every call between two `await`s. The blocking call is one of them.

### Output
Candidate list with file:line and how each was found.

### Quality Gate
- `/tmp/ruff_async.txt` is saved (or ruff is recorded as unavailable).
- Each slow-callback row from the input maps to at least one candidate, or has a note explaining why none was found.

---

## Phase 2: Assign the Replacement

### Entry Criteria
- Candidate list exists.

### Actions
1. Match each candidate to exactly one row:

| Category | Blocking call | Replacement |
|---|---|---|
| sleep | `time.sleep(s)` | `await asyncio.sleep(s)` |
| http | `requests.*`, `urllib.request.urlopen` | `httpx.AsyncClient` (`async with httpx.AsyncClient() as c: await c.get(...)`) or `aiohttp.ClientSession`; reuse one client per process |
| database | `psycopg2`, `pymysql`, sync SQLAlchemy `Session` | `asyncpg`, `psycopg` 3 `AsyncConnection`, SQLAlchemy `AsyncSession` with an async driver, `aiomysql`/`asyncmy` |
| redis | `redis.Redis` | `redis.asyncio.Redis` |
| file | `open().read()` on large files | `await asyncio.to_thread(path.read_bytes)` or the `aiofiles` package |
| subprocess | `subprocess.run` | `await asyncio.create_subprocess_exec(...)` then `await proc.communicate()` |
| cpu | hashing, compression, parsing, numpy work taking longer than the slow-callback threshold | `await loop.run_in_executor(process_pool, fn, *args)` with a `concurrent.futures.ProcessPoolExecutor`; threads do not help pure-Python CPU work under the GIL |
| sync-lock | `threading.Lock` acquired in a coroutine | `asyncio.Lock` if only coroutines share it; if threads share it too, move the locked work into `asyncio.to_thread` |
| future-wait | `concurrent.futures.Future.result()` in a coroutine | `await asyncio.wrap_future(fut)` |
| library-without-async | SDK with no async API (for example `boto3`) | `await asyncio.to_thread(client.method, *args)`; `asyncio.to_thread` is available from Python 3.9 |

2. Do not wrap every call in `to_thread` by default. Prefer the native async library when the project already depends on one; offload only when no async API exists.
3. Note the default thread pool size: `asyncio.to_thread` uses the loop's default `ThreadPoolExecutor`, whose `max_workers` default is documented in `concurrent.futures` (it depends on the Python version and CPU count). If many offloaded calls run at once, they queue; record this as a note rather than inventing a pool size.
4. Record any candidate where the replacement changes behavior (transactions in sync SQLAlchemy versus async session, connection pooling) in `notes`.

### Output
`py_blocking_calls`.

### Quality Gate
- Every row has exactly one `category` from the table and a `replacement` taken from that row.
- No `replacement` names a package that is neither in the project's dependency file (`pyproject.toml`, `requirements*.txt`) nor in the standard library, unless `notes` says it must be added.

---

## Phase 3: Confirm the Stall Before Fixing

### Entry Criteria
- Rows exist.

### Actions
1. For each row confirmed only by grep or ruff, prove it runs on the loop in the harness: rerun `race-py-asyncio-debug`'s command and look for `Executing <Task ... running at <file>:<line>` within the coroutine that contains the call.
2. If the debug run shows no slow callback for it, mark `confirmed_by` = `ruff` or `grep` and keep the row; it is still a stall under real network latency, but its priority is lower than rows with `slow-callback`.
3. Do not edit code in this flow. The fix is applied by `race-apply-fix`, one row at a time.

### Output
Rows with final `confirmed_by`.

### Quality Gate
- Every row has `confirmed_by` set.
- `git -C "<repo_path>" status --porcelain` shows no modified production files.

---

## Worked Example

Illustrative only.

Input slow-callback row: `ingest_one()` at `app/ingest.py:58`, 1.204 s.

Phase 1: lines 52 to 60 contain `resp = requests.get(url, timeout=10)` at line 55. `ruff check --select ASYNC app/` prints `app/ingest.py:55:12: ASYNC210 Async functions should not call blocking HTTP methods` (code confirmed with `ruff rule ASYNC210`).

Phase 2: category `http`; `httpx` is already in `pyproject.toml`, so replacement is `await client.get(url, timeout=10)` with a shared `httpx.AsyncClient`.

Phase 3: `confirmed_by` = `slow-callback`.

---

## Exit Criteria

DONE when every blocking call on the event loop is a row with one category, a replacement from the table, and a confirmation source, and no production file was modified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | ruff not installed | **Adjust**: `pip install ruff` in the dev environment, or rely on the grep list and record that. |
| Phase 2 | Call is inside a sync library callback the loop calls | **Adjust**: offload the whole callback with `asyncio.to_thread`; record the library name. |
| Phase 2 | No async driver for the database | **Adjust**: category `library-without-async`, offload with `asyncio.to_thread`, keep one connection per thread. |
| Phase 3 | Slow callback persists with no blocking call found | **Return**: record CPU work in the coroutine body itself (large loops, JSON of big payloads) as category `cpu`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
