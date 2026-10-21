# Confirm the Call Graph with a Language Server

**One-line description:** Confirms or rejects every candidate edge from the ripgrep trace using a language server's find-references, call-hierarchy and go-to-implementation requests (pyright or basedpyright, typescript-language-server, gopls, rust-analyzer), resolving the interface, trait and decorator dispatch that text search cannot see.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `symbol_trace` (object, required): Output of `tkt-rg-call-trace`.
- `repo_profile` (object, required): Output of `tkt-repo-orient-detect`.

---

## Outputs

- `confirmed_call_graph` (object): Nodes (symbol, definition file:line), edges (caller -> callee, call file:line, confirmed_by: `lsp-references`, `lsp-call-hierarchy`, `lsp-implementation` or `rg-only`), implementations of each interface or trait in the path, and false positives removed from the ripgrep trace with the reason.

---

## Phase 1: Start the Right Server

### Entry Criteria
- `symbol_trace` exists.
- The environment from the stack baseline flow is installed (a language server cannot resolve imports from packages that are not installed).

### Actions
1. Pick the server and the way you will call it:

| stack | Server | How to query |
|---|---|---|
| python | pyright or basedpyright (Pylance in VS Code) | Editor or agent LSP tool. Point it at the project venv: `[tool.pyright] venvPath = "."` and `venv = ".venv"` in `pyproject.toml`, or select the interpreter in the editor. |
| node | typescript-language-server (tsserver) | Editor or agent LSP tool. Needs `tsconfig.json` (or `jsconfig.json` for JS) at the project root. |
| go | gopls | Command line works: `gopls references`, `gopls call_hierarchy`, `gopls implementation`, `gopls definition`. Run `gopls help` to list commands for the installed version. |
| rust | rust-analyzer | Editor or agent LSP tool. Wait until indexing finishes (status bar shows no "indexing" progress) before querying. |

2. Editor commands in VS Code: Find All References = Shift+F12 (peek) or Shift+Alt+F12 (panel); Show Call Hierarchy = Shift+Alt+H; Go to Implementations = Ctrl+F12; Go to Definition = F12. In Neovim with built-in LSP: `:lua vim.lsp.buf.references()`, `:lua vim.lsp.buf.incoming_calls()`, `:lua vim.lsp.buf.implementation()`.
3. If your agent environment has an LSP tool, use its find-references, incoming-calls and go-to-implementation operations with the file path and the line and character of the symbol name.
4. Sanity check: request Go to Definition on one import in the entry file. If it fails to resolve, the server does not see your environment; fix that before continuing (Error Handling).

### Output
A server that resolves definitions in this repo.

### Quality Gate
- Go to Definition on a third-party import resolves to a file inside the installed environment (`.venv`, `node_modules`, Go module cache, or `~/.cargo/registry`).

---

## Phase 2: Confirm Each Edge

### Entry Criteria
- Server resolves definitions.

### Actions
1. For each candidate symbol in `symbol_trace`, place the cursor on the symbol name at its definition line and request find-references. Position must be on the identifier itself, not on `def`, `func` or `fn`.
2. Go example (positions are file:line:column, 1-based):
```
gopls references -d internal/export/csv.go:31:6
gopls call_hierarchy internal/export/csv.go:31:6
gopls implementation internal/store/store.go:12:6
```
3. Compare server results with the ripgrep call sites:
   - In both: mark edge `lsp-references`.
   - Only in ripgrep: false positive (a different symbol with the same name, a comment, a string). Remove it and record why.
   - Only in the server: a call ripgrep missed (aliased import, re-export, method via embedding). Add it.
4. For each unresolved dispatch point from `symbol_trace`: on an interface method or trait method, request go-to-implementation and add every implementation as a node. On a decorator-registered handler, find references to the decorator target and record the registration site.
5. Use call hierarchy (incoming calls) from the handler upward until you reach an entry point from `repo_profile.entry_points` or a test.

### Output
Confirmed edges, added edges, removed false positives.

### Quality Gate
- Every edge in the output has a `confirmed_by` value.
- Every interface or trait call in the path lists all implementations returned by the server.

---

## Phase 3: Write the Graph

### Entry Criteria
- Edges confirmed.

### Actions
1. Write `confirmed_call_graph` with nodes, edges, implementations and removed false positives.
2. Mark edges that stayed `rg-only` (the server could not resolve them, for example dynamic `getattr`). These carry risk into `tkt-change-impact-list`.
3. List test files that reference any node; they are the first tests to run after editing.

### Output
`confirmed_call_graph`.

### Quality Gate
- Count of `rg-only` edges is stated.
- Every node has a definition file:line.

---

## Worked Example

Illustrative only. Go service; `symbol_trace` has candidate `ExportCSV` with 3 rg call sites and an unresolved call `s.store.ListInvoices(...)` through interface `Store`.

```
$ gopls references internal/export/csv.go:31:6
/work/billing/internal/api/handlers.go:88:14-23
/work/billing/internal/export/csv_test.go:19:9-18
$ gopls implementation internal/store/store.go:12:2
/work/billing/internal/store/postgres.go:40:20-32
/work/billing/internal/store/memory.go:22:18-30
```

Result: the rg hit at `docs/examples/main.go:7` was a comment (false positive, removed). Edge `handlers.ExportInvoices -> export.ExportCSV` confirmed. `Store.ListInvoices` has two implementations, `postgres.go:40` and `memory.go:22`; both are nodes, so a change to the interface touches both. Tests referencing nodes: `internal/export/csv_test.go`, `internal/store/postgres_test.go`.

---

## Exit Criteria

DONE when every candidate edge is confirmed, removed with a reason, or marked `rg-only`, every interface or trait call lists its implementations, and the related test files are listed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Server shows unresolved imports everywhere | **Adjust**: point it at the environment (pyright `venvPath`/`venv`, open the folder that holds `tsconfig.json` or `go.mod` or `Cargo.toml`) and restart the server. |
| Phase 1 | No language server available | **Return**: pass the graph forward with every edge `rg-only` and say so in the output. |
| Phase 2 | References list is empty for a symbol you know is used | **Retry**: confirm the cursor is on the identifier and indexing finished; then retry once. |
| Phase 2 | Server returns references in generated code | **Adjust**: keep them as nodes but mark generated; the generator source is what to edit. |
| Phase 3 | Graph has more than one entry path | **Adjust**: keep all paths; impact listing needs every one. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
