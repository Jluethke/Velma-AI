# Error Boundary Map

**One-line description:** Lists every place in a codebase where an error stops propagating (HTTP handlers, CLI entry points, job workers, message consumers, scheduled tasks, thread and task roots), records the framework hook that catches errors there, and records the exact logging and test commands, so later flows know where errors may be handled and where they must only be propagated.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `stack` (string, required): One of `python`, `go`, `rust`, `typescript`. Drives which search commands run.
- `framework` (string, optional): Web or worker framework if known (fastapi, flask, django, net/http, chi, gin, axum, actix-web, express, fastify, celery, sidekiq-style worker). If absent, detect it in Phase 1.

---

## Outputs

- `boundary_map` (object): `{ stack, framework, logger, test_command, boundaries: [ { kind, file, line, symbol, current_handler, logs_here } ] }`. `kind` is one of `http`, `cli`, `worker`, `consumer`, `scheduler`, `task_root`, `thread_root`.

---

## Phase 1: Detect Framework and Logger

### Entry Criteria
- `repo_path` exists and contains source for `stack`.

### Actions
1. Read the dependency manifest for the stack. Do not guess from file names.
   - python: `pyproject.toml`, `requirements*.txt`, `setup.cfg`.
   - go: `go.mod`.
   - rust: every `Cargo.toml` (`rg --files -g Cargo.toml`).
   - typescript: `package.json` (`dependencies` and `devDependencies`).
2. Record the framework from this table. If two web frameworks appear, record both and treat each as its own boundary set.

| Dependency found | `framework` value |
|---|---|
| `fastapi` or `starlette` | fastapi |
| `flask` | flask |
| `django` plus `djangorestframework` | drf |
| `github.com/go-chi/chi` | chi |
| `github.com/gin-gonic/gin` | gin |
| only stdlib `net/http` imports | net/http |
| `axum` | axum |
| `actix-web` | actix-web |
| `express` | express |
| `fastify` | fastify |

3. Record the logger from the manifest: python `logging` (stdlib, always present), `structlog`, `loguru`; go `log/slog`, `go.uber.org/zap`, `github.com/rs/zerolog`; rust `tracing`, `log`; typescript `pino`, `winston`, or bare `console`.
4. Record the test command from the repo, not from memory: look for `[tool.pytest.ini_options]`, a `Makefile` target, `package.json` `scripts.test`, `cargo test`, `go test ./...`. Run it once with no changes and save the pass/fail count as the baseline.

### Output
Framework, logger and baseline test result recorded.

### Quality Gate
- `framework` and `logger` each cite the manifest file and line where they were found.
- The baseline test command was run and its summary line (for example `42 passed` or `ok  example.com/svc  0.31s`) is pasted in the record.

---

## Phase 2: Find Boundaries

### Entry Criteria
- Framework and logger recorded.

### Actions
1. Run the searches for `stack`. Use `rg -n` so every hit has a file and line. In the table, `\|` is Markdown table escaping: type a plain `|` when you run the command.

| stack | Boundary | Command |
|---|---|---|
| python | HTTP routes | `rg -n "@(app\|router\|bp)\.(get\|post\|put\|patch\|delete\|route)\(" --type py` |
| python | Existing error hooks | `rg -n "exception_handler\|errorhandler\|EXCEPTION_HANDLER\|got_request_exception" --type py` |
| python | CLI and scripts | `rg -n "if __name__ == .__main__.\|@click\.command\|typer\.Typer\|argparse\.ArgumentParser" --type py` |
| python | Workers | `rg -n "@(app\|celery_app\|shared_task)\.?task\|@shared_task\|dramatiq\.actor\|rq\b" --type py` |
| python | Task roots | `rg -n "asyncio\.create_task\|TaskGroup\|ThreadPoolExecutor\|threading\.Thread\(" --type py` |
| go | HTTP | `rg -n "HandleFunc\|\.Handle\(\|http\.Handler\b\|r\.(Get\|Post\|Put\|Delete)\(" --type go` |
| go | Entry points | `rg -n "^func main\(\)" --type go` |
| go | Goroutine roots | `rg -n "\bgo func\|\bgo [a-zA-Z_.]+\(\|errgroup\." --type go` |
| rust | HTTP | `rg -n "Router::new\|\.route\(\|#\[(get\|post\|put\|delete)\(" --type rust` |
| rust | Entry points | `rg -n "fn main\(\)\|#\[tokio::main\]" --type rust` |
| rust | Task roots | `rg -n "tokio::spawn\|std::thread::spawn\|JoinSet" --type rust` |
| typescript | HTTP | `rg -n "\.(get\|post\|put\|patch\|delete\|use)\(['\"/]" --type ts` |
| typescript | Error middleware | `rg -n "\(err, req, res, next\)\|setErrorHandler\|ErrorRequestHandler" --type ts` |
| typescript | Process hooks | `rg -n "unhandledRejection\|uncaughtException" --type ts` |
| typescript | Workers | `rg -n "new Worker\(\|\.process\(\|queue\.on\(" --type ts` |

2. For each hit, open the file and record one row: `kind`, `file`, `line`, `symbol` (function or route), `current_handler` (the code that catches errors there today, or `none`), `logs_here` (true if that handler logs).
3. Every task root and goroutine root is a boundary: an error raised there has no caller. Record whether it is joined (awaited, `errgroup.Wait`, `JoinHandle.await`) or fire-and-forget.

### Output
Draft `boundaries` list.

### Quality Gate
- Every row has a file and line that opens to the stated symbol.
- Every fire-and-forget task root is marked `current_handler: none` unless a handler is shown in code.

---

## Phase 3: Emit Map

### Entry Criteria
- Draft list complete.

### Actions
1. Deduplicate rows that point at the same handler.
2. Write `boundary_map` as JSON to the run record (not into the repo).
3. Mark rows where `current_handler` is `none` and `kind` is `http`: those return the framework default error body today, which later flows replace.

### Output
`boundary_map`.

### Quality Gate
- `boundary_map.boundaries` has at least one row per entry point found by the `main` search.
- `boundary_map.test_command` is the exact command that produced the baseline line in Phase 1.

---

## Worked Example

Illustrative. Input: `repo_path=/srv/orders`, `stack=python`, `framework` absent.

Phase 1: `pyproject.toml` line 14 `fastapi = "^0.115"`, line 18 `structlog`. Baseline: `uv run pytest -q` prints `118 passed in 4.21s`.

Phase 2:
```
$ rg -n "exception_handler|errorhandler" --type py
app/main.py:41:@app.exception_handler(RequestValidationError)
$ rg -n "asyncio\.create_task" --type py
app/events.py:77:    asyncio.create_task(publish(evt))
```
Rows: `http app/main.py:41 handler=validation-only logs_here=false`; `task_root app/events.py:77 current_handler=none` (fire-and-forget: an exception there is reported only as "Task exception was never retrieved").

Phase 3: `boundary_map` with 23 HTTP rows, 1 CLI row (`app/cli.py:9`), 2 task roots.

---

## Exit Criteria

DONE when `boundary_map` lists every entry point, HTTP route group, worker and task root with its current handler, and the baseline test result is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No dependency manifest found | **Stop**: ask for the build file; do not infer the framework from folder names. |
| Phase 1 | Baseline tests fail before any change | **Return**: record the failing test names as pre-existing; later flows must not claim them as regressions or fixes. |
| Phase 2 | `rg` not installed | **Adjust**: install ripgrep (`winget install BurntSushi.ripgrep.MSVC`, `brew install ripgrep`, `apt install ripgrep`); do not fall back to reading files by hand. |
| Phase 2 | Routes registered dynamically (loops, plugins) | **Adjust**: record the registration function as one boundary row and note it. |
| Phase 3 | More than one framework | **Adjust**: emit one boundary set per framework in the same map. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
