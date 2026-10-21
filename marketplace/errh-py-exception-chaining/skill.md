# Python Exception Hierarchy and Chaining

**One-line description:** Applies the triage actions to Python code one file at a time using a single application exception hierarchy, explicit chaining with `raise ... from exc`, narrow `except` clauses, correct handling of `asyncio.CancelledError` and `ExceptionGroup`, and `add_note` for context, running the tests after every file.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `triage_table` (object[], required): From `errh-catch-site-triage`.
- `error_taxonomy` (object, required): From `errh-error-taxonomy`.
- `logging_policy` (object, required): From `errh-log-once-at-boundary`.
- `test_command` (string, required): Exact test command, for example `uv run pytest -q`.

---

## Outputs

- `py_error_changes` (object): `{ hierarchy_file, classes: [ { name, base, taxonomy_class } ], sites_fixed: [site_id], test_runs: [ { file, summary_line } ] }`.

---

## Phase 1: Create the Hierarchy

### Entry Criteria
- `python --version` is recorded (features below depend on it: `add_note`, `ExceptionGroup` and `except*` need 3.11+).

### Actions
1. Create one module, for example `app/errors.py`. One base class, one subclass per taxonomy class the code raises, and domain leaf classes beneath them.

```python
class AppError(Exception):
    """Base for errors this application raises on purpose."""
    taxonomy_class = "bug"

class NotFoundError(AppError):
    taxonomy_class = "not_found"

class ConflictError(AppError):
    taxonomy_class = "conflict"

class DependencyUnavailable(AppError):
    taxonomy_class = "dependency_transient"

class InvoiceNotFound(NotFoundError):
    def __init__(self, invoice_id: int) -> None:
        super().__init__(f"invoice {invoice_id} not found")
        self.invoice_id = invoice_id
```

2. Naming: class names end in `Error` (PEP 8 "Exception Names") except domain leaves that read as nouns when the team already uses that style; record the choice.
3. Never subclass `BaseException`. `KeyboardInterrupt`, `SystemExit`, `GeneratorExit` and `asyncio.CancelledError` (since 3.8) derive from `BaseException` so that `except Exception` does not catch them.
4. Run `test_command`. It must match the baseline.

### Output
Hierarchy module.

### Quality Gate
- `python -c "import app.errors"` exits 0.
- Test summary equals the baseline count.

---

## Phase 2: Apply Triage Actions per File

### Entry Criteria
- Hierarchy exists. `triage_table` rows sorted by `order`.

### Actions
1. Take the rows for ONE file. Apply each action with this exact idiom:

| action | Python idiom |
|---|---|
| `propagate` | Delete the `try/except`. Do not replace it with `except Exception: raise`. |
| `narrow` | Replace `except Exception` with the concrete tuple, for example `except (httpx.TimeoutException, httpx.ConnectError) as exc:` |
| `wrap_with_cause` | `raise DependencyUnavailable(f"fetch rates {currency}") from exc` |
| `wrap_no_log` | Delete the log line; keep `raise X(...) from exc` |
| `convert_domain` | `except NoResultFound as exc: raise InvoiceNotFound(invoice_id) from exc` |
| `keep_documented` | `with contextlib.suppress(FileNotFoundError):` plus a comment naming the contract, or a narrow `except` with the comment |
| `reraise_cancellation` | `except asyncio.CancelledError: <cleanup>; raise` |
| `return_error` | Replace `sys.exit`/`os._exit` outside `main` with raising an `AppError` subclass |
| `move_to_retry_policy` | Delete the loop; decorate the call with the `tenacity` policy from `retry_policy_table` |

2. Chaining rules:
   - `raise New(...) from exc` sets `__cause__`; the traceback prints "The above exception was the direct cause of the following exception".
   - `raise New(...)` inside `except` without `from` sets only `__context__` ("During handling of the above exception, another exception occurred"), which reads like a second bug. Always use `from`.
   - `raise New(...) from None` hides the original; use it only when the original holds secrets, and log nothing extra.
   - Bare `raise` re-raises the current exception unchanged. `raise exc` (TRY201) works but is longer; use bare `raise`.
   - To add context without changing the type (3.11+): `exc.add_note(f"while loading invoice {invoice_id}"); raise`.
3. Concurrency: `asyncio.TaskGroup` (3.11+) raises an `ExceptionGroup`. Handle with `except* DependencyUnavailable as eg:` and iterate `eg.exceptions`. Do not catch `ExceptionGroup` with plain `except Exception` and read only the first item.
4. `finally` must not contain `return`, `break` or `continue` (they discard the in-flight exception; ruff B012).
5. Run `test_command`. Record the summary line. Go to the next file only on a pass.

### Output
Fixed files, one test run per file.

### Quality Gate
- `git diff --stat` after each step shows exactly one source file changed (plus test files for that module, if any).
- Every test run summary is recorded and none has fewer passed tests than the baseline.
- `rg -n -U --type py "except[^\n]*:\s*\n\s*pass\s*$" <file>` returns nothing for fixed files unless the row is `keep_documented`.

---

## Phase 3: Check the Chain End to End

### Entry Criteria
- All rows applied.

### Actions
1. For one site per taxonomy class, write a throwaway script in a scratch directory outside the repo that triggers it and prints `traceback.format_exception(exc)` (3.10+ signature). Confirm the original exception appears under "direct cause".
2. Compare with `logging_policy`: no fixed site logs and raises.
3. Fill `py_error_changes`.

### Output
`py_error_changes`.

### Quality Gate
- Each sampled class shows "The above exception was the direct cause" in the printed traceback.
- `rg -n "raise \w+\(.*\)\s*$" --type py` over changed files shows no raise inside an `except` that lacks `from` (confirm with `ruff check --select B904`).

---

## Worked Example

Illustrative. Row: `app/rates.py:22 observed=broad_type action=wrap_with_cause class=dependency_transient`.

Before:
```python
try:
    r = client.get(f"/rates/{ccy}")
    r.raise_for_status()
except Exception as e:
    logger.error("rates failed: %s", e)
    return None
```
After:
```python
try:
    r = client.get(f"/rates/{ccy}")
    r.raise_for_status()
except (httpx.TimeoutException, httpx.TransportError) as exc:
    raise DependencyUnavailable(f"fetch rates {ccy}") from exc
```
`httpx.HTTPStatusError` from `raise_for_status()` now propagates to be mapped by status. `uv run pytest -q` prints `118 passed`; callers that relied on `None` fail, which is expected: fix them in their own file step.

---

## Exit Criteria

DONE when every Python row in `triage_table` is applied, every `raise` inside an `except` uses `from`, and the test suite is at or above baseline after each file.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Project already has an exception base | **Adjust**: reuse it as `AppError`; do not create a second root. |
| Phase 2 | Tests fail after removing a swallow | **Adjust**: the failure shows a caller depended on the swallow; fix the caller in the next file step. Never re-add the swallow and never delete or skip the test. |
| Phase 2 | Unsure which exceptions a library raises | **Adjust**: read the library's exceptions module (for example `httpx._exceptions` is documented under "Exceptions"); do not invent class names. |
| Phase 2 | More than one file changed in a step | **Stop**: `git stash` the extra file and redo the step. |
| Phase 3 | Python older than 3.11 | **Adjust**: skip `add_note` and `except*`; use wrapping only. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
