# Log Once at the Boundary

**One-line description:** Enforces the rule "handle or propagate, never both": removes log calls from code that also re-raises or returns the error, keeps exactly one log event per failed operation at the boundary with the full cause chain and correlation id, and sets its level from the error taxonomy.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `go`, `rust` or `typescript`.
- `boundary_map` (object, required): From `errh-boundary-map`.
- `triage_table` (object[], required): From `errh-catch-site-triage`.
- `context_plan` (object, required): From `errh-context-and-correlation-id`.

---

## Outputs

- `logging_policy` (object): `{ boundary_logger_call, level_by_class, double_log_sites: [file:line], chain_rendering, verified_single_event: true|false }`.

---

## Phase 1: Find Double Logging

### Entry Criteria
- `triage_table` exists. Sites with action `wrap_no_log` are already known double-log sites.

### Actions
1. Find additional log-and-propagate sites. In the table, `\|` means a plain `|`.

| stack | Command |
|---|---|
| python | `rg -n -U --type py "except[^\n]*:\n(\s+[^\n]*\n){0,6}?\s+(log\|logger\|LOG)\.(error\|exception\|warning)\([^\n]*\n(\s+[^\n]*\n){0,6}?\s+raise\b"` |
| go | `rg -n -U --type go "if err != nil \{\n(\s+[^\n]*\n){0,4}?\s+(log\|slog\|logger\|l)\.\w*(Error\|Printf\|Warn)\w*\([^\n]*\n(\s+[^\n]*\n){0,4}?\s+return [^\n]*err"` |
| rust | `rg -n --type rust "#\[(tracing::)?instrument\([^)]*\berr\b"` (the `err` argument emits an event at every instrumented layer) and `rg -n -U --type rust "(error\|warn)!\([^\n]*\n\s*(return Err\|Err\()"` |
| typescript | `rg -n -U --type ts "catch\s*\(\w+[^)]*\)\s*\{\n(\s+[^\n]*\n){0,6}?\s+(logger\|log\|console)\.(error\|warn)\([^\n]*\n(\s+[^\n]*\n){0,6}?\s+throw\b"` |

2. Add the Semgrep `errh-*-log-and-*` findings if `.semgrep/errh.yml` exists: `semgrep scan --config .semgrep/errh.yml --json | jq -r '.results[] | select(.check_id \| test("log-and")) | "\(.path):\(.start.line)"'`.
3. Record every hit in `double_log_sites`.

### Output
`double_log_sites`.

### Quality Gate
- Every command for `stack` ran; hit counts recorded including zero.

---

## Phase 2: Define the Boundary Log Event

### Entry Criteria
- Sites listed.

### Actions
1. Set `level_by_class` from the fixed `log_level` column of the base class table in `errh-error-taxonomy` (class names appear in `triage_table` rows as `error_class`): `bug` and exhausted `dependency_transient` at error; `rate_limited` at warn; expected 4xx classes at info (or not logged when access logs already record the status); `cancelled` at debug.
2. Define one boundary call per stack that renders the whole chain once:

| stack | Boundary call | Chain rendering |
|---|---|---|
| python stdlib | `logger.exception("request failed", extra={...})` inside the boundary `except`, or `logger.error(..., exc_info=exc)` outside it | traceback prints `__cause__` ("The above exception was the direct cause...") and `__context__` chains |
| python structlog | `log.exception("request failed")` with `structlog.processors.format_exc_info` or `dict_tracebacks` in the chain | same chain |
| go slog | `logger.ErrorContext(ctx, "request failed", "err", err)` | `err.Error()` already holds the `%w` chain text |
| rust tracing | `tracing::error!(error = %format!("{err:#}"), "request failed")` for anyhow (`{:#}` prints the chain on one line), or iterate `std::error::Error::source()` for thiserror types | explicit |
| typescript pino | `logger.error({ err }, "request failed")` | pino's `err` serializer; confirm in the pino-std-serializers docs for your version how `cause` is rendered, and add a serializer that walks `err.cause` if it is not |

3. The boundary also logs nothing for errors already turned into a response by a lower handler (avoid a second event from the framework). Check: Starlette re-raises unhandled exceptions after the `Exception` handler responds, so the server also logs them; FastAPI users either keep the server log and do not log in the handler, or log in the handler and filter the server logger. Record which one.

### Output
Boundary call and level table.

### Quality Gate
- `level_by_class` has an entry for every taxonomy class.
- The framework's own error logging behavior is recorded with a doc or source link.

---

## Phase 3: Remove Duplicates and Verify

### Entry Criteria
- Boundary call defined.

### Actions
1. For each `double_log_sites` entry, one file at a time: delete the log call; keep or add the wrap with context (per the stack idiom flow). Run the test command after each file.
2. Do NOT remove a log call that is the only record of an error that is intentionally not propagated (`keep_documented` rows); downgrade it to the class level instead.
3. Verify with one forced failure: trigger a known error path (a failing test or a request to a missing id) and count events for its correlation id: `rg -c "<id>" <log output>` must be 1 for the error event (access log lines excluded).

### Output
`logging_policy`.

### Quality Gate
- Rerunning the Phase 1 commands returns zero hits, or each remaining hit is a `keep_documented` site listed by file and line.
- The forced-failure count for the error event is exactly 1; `verified_single_event` is true.
- The full test command passes.

---

## Worked Example

Illustrative. `stack=python`, stdlib logging, FastAPI.

Phase 1 finds `app/orders/service.py:113` (`logger.exception("charge failed"); raise`) and `app/payments/client.py:61`.

Phase 3: delete both log lines; `service.py` becomes `raise ChargeFailed(f"charge order {order_id}") from exc`. Forced failure:
```
$ curl -s -H "X-Request-ID: t-123" -X POST localhost:8000/orders/77/charge
$ rg -c "t-123" logs/app.jsonl
1
```
Before the change the count was 3 (two inner logs plus the server traceback).

---

## Exit Criteria

DONE when each failed operation produces one error event at the boundary with the full chain and correlation id, and no inner layer both logs and propagates.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Multiline pattern too slow on a large repo | **Adjust**: restrict to source dirs with `-g 'src/**'` and run per directory. |
| Phase 2 | Logger cannot render causes | **Adjust**: add a serializer or formatter that walks the chain; test it with a two-level wrapped error. |
| Phase 3 | Forced failure shows 2 events | **Retry**: find the second emitter by its logger name field and remove or filter it. |
| Phase 3 | Tests asserted on the removed log line | **Adjust**: move the assertion to the boundary log; never delete the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
