# Call Tracing with ripgrep

**One-line description:** Finds where the behavior named in the acceptance criteria lives by searching the repository with ripgrep: from user-visible strings and routes to handler functions, then from each function to its definitions and every call site, producing a candidate call graph with file:line evidence for every edge.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_profile` (object, required): Output of `tkt-repo-orient-detect` (stack and entry points).
- `acceptance_criteria` (object[], required): Output of `tkt-acceptance-criteria-gwt`.

---

## Outputs

- `symbol_trace` (object): Seed terms searched, each with the exact `rg` command and match count; candidate symbols with definition file:line; candidate edges caller -> callee with the file:line of the call; list of dynamic dispatch points ripgrep cannot resolve.

---

## Phase 1: Seed Terms

### Entry Criteria
- `rg --version` prints a version (ripgrep installed). If not, see Error Handling.
- `acceptance_criteria` is non-empty.

### Actions
1. From each scenario, extract seed terms in this order of reliability: (1) URL paths and HTTP verbs (`/invoices/export`), (2) exact UI strings or error messages in quotes, (3) CLI flag names, (4) config keys and env var names, (5) domain nouns (invoice, export).
2. Search literals with fixed-string mode so regex characters are not interpreted: `rg -n -F '/invoices' --type <t>`. Ripgrep type names: `py`, `js`, `ts`, `go`, `rust` (list with `rg --type-list`).
3. For route paths, also search the path segments separately, because frameworks often split them: `rg -n -F 'invoices'` limited by `-g '*route*' -g '*urls.py' -g '*router*'` globs.
4. Record each command and its match count (`rg -c ... | wc -l` for files, or add `--stats` and read the `matches` line).

### Output
Seed term table with commands and counts.

### Quality Gate
- Every seed term has a recorded command and match count, including terms with 0 matches.
- At least one seed term has a match; otherwise stop (Error Handling).

---

## Phase 2: Definitions and Call Sites

### Entry Criteria
- Seed matches found.

### Actions
1. From the matches, identify the handler symbol (function, method, class). Find its definition with a stack-specific pattern:

| stack | Definition search |
|---|---|
| python | `rg -n -w --type py '(def|class) export_invoices'` |
| node | `rg -n --type ts --type js '(function\s+exportInvoices|exportInvoices\s*[=:]\s*(async\s*)?\(|exportInvoices\s*\()'` then read the hits to keep only definitions |
| go | `rg -n --type go 'func (\([^)]*\) )?ExportInvoices\('` |
| rust | `rg -n --type rust 'fn export_invoices\b'` |

2. Find call sites with word boundaries so `export` does not match `exporter`: `rg -n -w 'export_invoices' --type py`. Remove the definition line from the results.
3. For methods, also search the attribute form: Python `\.export_invoices\(`, JS/TS `\.exportInvoices\(`, Go `\.ExportInvoices\(`, Rust `\.export_invoices\(` and `::export_invoices\(`.
4. Show context to understand each call: `rg -n -w -C 3 'export_invoices'`. Read the 3 lines above and below to see which function encloses the call.
5. Repeat Actions 1 to 4 one level up (callers of callers) until you reach an entry point listed in `repo_profile.entry_points`, a route registration, or a test file. Stop at depth where you reach those; record the depth.
6. Exclude generated and vendored code explicitly so you do not trace into it: add `-g '!vendor/**' -g '!node_modules/**' -g '!dist/**' -g '!target/**' -g '!*.min.js'`. Note: ripgrep already skips files in `.gitignore`; `--no-ignore` turns that off; do not use it unless you need to search ignored files.

### Output
Candidate symbols and edges.

### Quality Gate
- Every edge has a caller file:line that you can open and see the call text.
- Every candidate symbol has exactly one definition file:line, or is listed as "multiple definitions" with all of them.

---

## Phase 3: Mark What ripgrep Cannot See

### Entry Criteria
- Candidate graph exists.

### Actions
1. Search for dynamic dispatch that text search misses, and list each hit as unresolved:
   - Python: `getattr(`, `importlib.import_module(`, decorators that register handlers (`@app.route`, `@router.get`, `@receiver`, `@celery.task`), string task names.
   - JS/TS: `obj[name](`, dependency injection decorators (`@Injectable`, `@Controller`), event emitters `.on('`.
   - Go: interface method calls (any call through an interface value), `reflect.`, function values stored in maps.
   - Rust: trait method calls through `dyn Trait` or generics, macros that generate functions.
2. Write each unresolved point with the reason. `tkt-lsp-reference-trace` confirms these.
3. Write `symbol_trace`.

### Output
`symbol_trace`.

### Quality Gate
- `symbol_trace` lists the exact rg command for every edge.
- Every interface or trait method in the graph appears in the unresolved list for LSP confirmation.

---

## Worked Example

Illustrative only. Stack python, scenario "GET /accounts/77/invoices/export".

```
$ rg -n -F '/invoices/export' --type py
src/billing/api/routes.py:41:@router.get("/accounts/{account_id}/invoices/export")
$ rg -n -A 3 -F '/invoices/export' src/billing/api/routes.py
41:@router.get("/accounts/{account_id}/invoices/export")
42-async def export_invoices(account_id: int, status: str | None = None, ...):
43-    rows = invoice_service.list_for_export(account_id, status)
44-    return csv_response(rows)
$ rg -n -w 'list_for_export' --type py
src/billing/services/invoice_service.py:88:def list_for_export(account_id, status):
src/billing/api/routes.py:43:    rows = invoice_service.list_for_export(account_id, status)
tests/services/test_invoice_service.py:120:    invoice_service.list_for_export(77, "paid")
$ rg -n -w 'csv_response' --type py
src/billing/api/responses.py:12:def csv_response(rows):
src/billing/api/routes.py:44:    return csv_response(rows)
src/billing/api/reports.py:67:    return csv_response(report_rows)
```

`symbol_trace` edges: `routes.export_invoices -> invoice_service.list_for_export (routes.py:43)`, `routes.export_invoices -> responses.csv_response (routes.py:44)`, `reports.<fn> -> csv_response (reports.py:67)`. Unresolved: route registered by decorator `@router.get` (framework dispatch).

---

## Exit Criteria

DONE when every acceptance criterion has at least one seed match leading to a handler, each edge has file:line evidence and its rg command, and dynamic dispatch points are listed for LSP confirmation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | ripgrep not installed | **Adjust**: use `git grep -n -w -F '<term>'`, which searches tracked files only; record the substitution. |
| Phase 1 | Zero matches for every seed term | **Stop**: the feature may not exist yet or uses different words; ask the ticket owner for the screen URL or an example log line. |
| Phase 2 | Thousands of matches for a common name | **Adjust**: narrow with `-w`, `--type`, a directory argument, or search the qualified form (`invoice_service.list_for_export`). |
| Phase 2 | Name is built from strings at runtime | **Adjust**: add it to the unresolved list in Phase 3. |
| Phase 3 | Many interface implementations | **Return**: pass all of them to `tkt-lsp-reference-trace`; do not pick one. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
