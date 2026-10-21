# Public API Inventory

**One-line description:** Lists every symbol a library currently exposes to importers, classifies each one as intended public API or accidental leak with a fixed decision table, and records the leaks that must be closed before the release locks them in.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `package_profile` (object, required): From `pkg-scope-intake`; supplies the stack, layout and import name.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `public_api` (object[]): One row per exposed symbol: `path` (for example `tinyretry.retry` or `widget/v2.Client`), `kind` (function, class, type, constant, module, subpath), `documented` (true/false), `verdict` (`public` or `leak`), and the decision-table row that gave the verdict.
- `api_leaks` (object[]): The rows with verdict `leak`, each with the fix (make private, move to internal, stop re-exporting) and whether any released version already exposed it.

---

## Phase 1: Dump What Importers Can Reach Today

### Entry Criteria
- `package_profile.stack` is set.

### Actions
1. Run the listing for the stack. Run it against the installed or built package, not by reading source by eye.

   | Stack | Command | What to read |
   |---|---|---|
   | python | `python -m pip install -e .` then `python -c "import <pkg>; print(sorted(n for n in dir(<pkg>) if not n.startswith('_')))"` | every name printed is reachable as `<pkg>.<name>` |
   | python | `python -m pip install griffe` then `griffe dump <pkg> -s src` (drop `-s src` for flat layout) | JSON of every module, class and function |
   | node | `npm pkg get exports main module types` | each key is a reachable entry point |
   | node (TypeScript) | `npx tsc --declaration --emitDeclarationOnly --outDir /tmp/api-dts` | every `export` in the `.d.ts` files |
   | go | `go list ./...` then `go doc -all <pkg path>` per package | every package not under `internal/` and every capitalized identifier |
   | rust | `cargo doc --no-deps` and, if installed, `cargo public-api` (needs a nightly toolchain installed; check `cargo public-api --help`) | every `pub` item reachable from the crate root |

2. Also list modules or subpaths that are importable but not meant to be (Python submodules like `<pkg>.utils`, Node files reachable when `exports` is missing, Go packages outside `internal/`).
3. Save the raw output in the report. Do not summarize it away.

### Output
Raw symbol list with its source command.

### Quality Gate
- Every row traces to a line of command output in the report.
- The listing ran without import errors (exit code 0).

---

## Phase 2: Classify Each Symbol

### Entry Criteria
- Raw list exists.

### Actions
1. Apply this table to each symbol. The first matching row wins:

   | # | Condition | Verdict |
   |---|---|---|
   | 1 | Name or module starts with `_` (Python), lives under `internal/` (Go), is `pub(crate)` (Rust) | not exposed; drop from list |
   | 2 | Used in the README, the docs site, or a docstring example | public |
   | 3 | Appears in a released version's changelog as an added feature | public |
   | 4 | Test helper, fixture, mock, or debug function | leak |
   | 5 | A third-party library's type or module re-exported by accident (for example `from requests import Session` at package top level) | leak |
   | 6 | Implementation module reachable only because no export list exists | leak |
   | 7 | None of the above | ask the user; record as `undecided` |

2. For every public symbol whose signature uses a third-party type (a parameter typed `requests.Session`, a Rust function returning `serde_json::Value`), add a note: that dependency's major version is now part of this library's API, so bumping it is a breaking change.
3. For every leak, check whether it shipped in a released version: python `pip download <name>==<last> --no-deps` and unzip; node `npm view <name>@<last> exports`; go `git show <last_tag>:<path>`; rust `cargo public-api` against the last version or `git show`. A leak that already shipped cannot be removed in a minor or patch release; mark it `deprecate_first`.

### Output
Classified `public_api`.

### Quality Gate
- Every row has a verdict and the table row number.
- Zero rows are `undecided`, or each `undecided` row is listed as an open question to the user.

---

## Phase 3: Write the Leak List

### Entry Criteria
- Classification done.

### Actions
1. Copy each `leak` row to `api_leaks` with a fix chosen from this table:

   | Stack | Fix |
   |---|---|
   | python | rename module to `_name.py`, leave the symbol out of `__all__` |
   | node | leave the subpath out of `exports` |
   | go | move the package under `internal/` or lower-case the identifier |
   | rust | change to `pub(crate)` or stop the `pub use` |

2. For `deprecate_first` leaks, the fix is: keep the symbol, emit a deprecation warning (Python `warnings.warn(..., DeprecationWarning, stacklevel=2)`, TypeScript `/** @deprecated */`, Go `// Deprecated:` doc comment, Rust `#[deprecated]`), and remove it in the next major release.
3. Do not change any code in this flow. The stack-specific export flows apply the fixes.

### Output
`public_api`, `api_leaks`.

### Quality Gate
- Every `api_leaks` row names one fix from the table.
- `git status --porcelain` shows no source changes made by this flow.

---

## Worked Example

Illustrative. Python package `tinyretry`, src layout.

Phase 1:
```
$ python -c "import tinyretry; print(sorted(n for n in dir(tinyretry) if not n.startswith('_')))"
['RetryError', 'backoff', 'retry', 'sleep_for_tests', 'time', 'utils']
```

Phase 2: `retry`, `RetryError`, `backoff` are in the README (row 2, public). `sleep_for_tests` is a test helper (row 4, leak). `time` is the stdlib module imported at top level (row 5, leak). `utils` is an implementation module (row 6, leak). `utils` shipped in 0.4.1, so it is `deprecate_first`.

Phase 3: `api_leaks` = `sleep_for_tests` (move to `tests/conftest.py`), `time` (import inside the function or `import time as _time`), `utils` (rename to `_utils.py`, keep a `utils.py` shim that warns until 1.0).

---

## Exit Criteria

DONE when every reachable symbol has a verdict and every leak has a named fix, with no code changed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Package fails to import | **Stop**: fix the import error first; an inventory of a broken package is meaningless. |
| Phase 1 | `cargo public-api` not installed or nightly missing | **Adjust**: use `cargo doc --no-deps` and read `target/doc/<crate>/all.html`. |
| Phase 2 | Symbol use is unclear | **Return**: list it as `undecided` for the user; do not guess. |
| Phase 3 | Leak already shipped | **Adjust**: deprecate first; never delete a released symbol outside a major release. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
