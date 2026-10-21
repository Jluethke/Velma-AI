# Deprecation Policy and Notices

**One-line description:** Writes a deprecation policy (deprecate in a MINOR release, remove only in a later MAJOR release, always name the replacement) and adds the stack-correct compile-time marker and runtime warning for each deprecated public symbol, with a test that proves the warning fires.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository root.
- `stack` (string, required): `python`, `node`, `go`, or `rust`.
- `deprecated_symbols` (object[], optional): Each entry: `symbol` (fully qualified public name), `replacement` (name or "none"), `reason`. When empty this flow only writes the policy.
- `support_window` (string, optional): The user's promised minimum time or number of minor releases between deprecation and removal. If not given, record it as an open question; do not invent a number.

---

## Outputs

- `deprecation_policy` (object): Path of the policy file and its rules: deprecation lands in a MINOR version, removal only in a MAJOR version, minimum window (`support_window` or "open question"), required notice text format.
- `deprecation_notices` (object[]): Per symbol: `symbol`, `since` version, `removal_in` version, `replacement`, file and line of the marker, and the test that asserts the warning.

---

## Phase 1: Write the Policy

### Entry Criteria
- `repo_path` exists and is a git repository.

### Actions
1. Read the current version: Python `grep -n '^version' pyproject.toml` (or the dynamic version source), Node `node -p "require('./package.json').version"`, Go `git describe --tags --abbrev=0`, Rust `cargo metadata --no-deps --format-version 1 | jq -r '.packages[0].version'`.
2. Set `since` = the next MINOR version (SemVer 2.0.0 item 7: a deprecation of public API functionality requires at least a MINOR increment). Set `removal_in` = the next MAJOR version. If the current major is 0, write both and flag that 0.x makes no stability promise.
3. Create `DEPRECATION.md` (or a `## Deprecation policy` section in `CONTRIBUTING.md` if the project keeps policies there). Include: the MINOR/MAJOR rule, the window from `support_window`, the notice format `"<symbol> is deprecated since <since> and will be removed in <removal_in>; use <replacement> instead."`, and that every deprecation gets a `### Deprecated` entry in the changelog (Keep a Changelog 1.1.0 section name).

### Output
Policy file and `deprecation_policy`.

### Quality Gate
- `git diff --stat` shows only the policy file changed in this phase.
- The policy text contains the words MINOR and MAJOR and either the `support_window` value or "open question".

---

## Phase 2: Mark Each Symbol

### Entry Criteria
- Policy exists. `deprecated_symbols` is non-empty.

### Actions
1. Work on ONE symbol at a time: mark it, add its test, run the tests, then move to the next. Do not edit every file in one pass.
2. Use the stack row below. Do not remove or change the behavior of the deprecated symbol; it must keep working until `removal_in`.

   | `stack` | Compile-time / doc marker | Runtime warning | How tools surface it |
   |---|---|---|---|
   | python | `@warnings.deprecated("msg")` on Python 3.13+ or `@typing_extensions.deprecated("msg")` (PEP 702) | The PEP 702 decorator emits `DeprecationWarning` at call time; for module attributes use `warnings.warn(msg, DeprecationWarning, stacklevel=2)` inside a module `__getattr__` | Type checkers report use; `DeprecationWarning` is hidden by default outside `__main__` and test runners |
   | node | JSDoc `/** @deprecated since 1.4.0, use parseStrict */` | `const old = util.deprecate(fn, msg, 'DEP_MYPKG_001')` from `node:util`; warns once per process per code | TypeScript editors strike through the name; `node --throw-deprecation` turns it into an exception |
   | go | A doc comment paragraph that starts exactly `// Deprecated: Use ParseStrict instead.` | none (Go has no runtime deprecation warning) | `staticcheck` check SA1019 and gopls report use; pkg.go.dev hides deprecated symbols by default |
   | rust | `#[deprecated(since = "1.4.0", note = "use parse_strict")]` | none | `rustc` emits the `deprecated` lint warning at each use |

3. For Python, choose `stacklevel=2` so the warning points at the caller, not at your library line. Do not use `PendingDeprecationWarning` for a symbol with a fixed `removal_in`.
4. For Go module-level deprecation (the whole module moves), add a `// Deprecated: use example.com/mod/v2 instead.` comment directly above the `module` line in `go.mod`.
5. Record each marker in `deprecation_notices`.

### Output
Marked symbols.

### Quality Gate
- `git grep -n "deprecated" -- <changed files>` shows one marker per entry in `deprecated_symbols`.
- Each marker message contains `since`, `removal_in` and the replacement name.

---

## Phase 3: Test the Warning and Log It

### Entry Criteria
- All symbols marked.

### Actions
1. Add one test per symbol that asserts the warning:
   - Python: `with pytest.warns(DeprecationWarning, match="parse_loose is deprecated"): parse_loose("x")`.
   - Node: run the deprecated call under `node --throw-deprecation` in a child process and assert the error code `DEP_MYPKG_001`, or listen with `process.on('warning', w => ...)` and assert `w.code`.
   - Go: assert in CI that `go doc <importpath>.<Symbol>` output contains `Deprecated:`, and run `staticcheck ./...` on a small caller in a temporary module to confirm it prints `SA1019`.
   - Rust: `cargo build 2>&1 | grep "use of deprecated"` on a doc test or example that calls the symbol with `#[allow(deprecated)]` removed.
2. Run the full test suite. Do not delete or weaken existing tests that call the deprecated symbol; wrap them in the stack's suppression (`pytest.mark.filterwarnings`, `#[allow(deprecated)]`, `//lint:ignore SA1019`) so they keep proving the old behavior still works.
3. Add a `### Deprecated` entry per symbol under the unreleased changelog section, or a `deprecate:` note in the commit body if the changelog is generated (a `feat:` commit type keeps the bump at MINOR).

### Output
`deprecation_notices` with test names.

### Quality Gate
- The test command exits 0 and its output lists each new deprecation test as passed.
- `deprecation_notices` has one row per input symbol with file, line and test name filled.

---

## Worked Example

Illustrative. `stack` = python, current version 1.3.2, `deprecated_symbols` = `[{symbol: "acme.parse_loose", replacement: "acme.parse", reason: "silently drops fields"}]`, `support_window` = "two minor releases".

- Phase 1: `since` = 1.4.0, `removal_in` = 2.0.0. `DEPRECATION.md` created.
- Phase 2: in `src/acme/_parse.py`:
  ```python
  from typing_extensions import deprecated

  @deprecated("acme.parse_loose is deprecated since 1.4.0 and will be removed in 2.0.0; use acme.parse instead.")
  def parse_loose(text): ...
  ```
- Phase 3: `pytest -q tests/test_deprecations.py` prints `1 passed`. Changelog gains `### Deprecated - acme.parse_loose: use acme.parse.` The commit is `feat(parse): deprecate parse_loose in favor of parse`.

---

## Exit Criteria

DONE when the policy file exists, every input symbol has a marker, a passing test proves its warning or marker, and each appears in `deprecation_notices` with `since` and `removal_in`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `support_window` not given | **Adjust**: write "open question" into the policy and `deprecation_policy`; do not choose a number. |
| Phase 2 | Symbol is not public (underscore name, internal package, `pub(crate)`) | **Return**: report that it needs no deprecation cycle and drop it from the list. |
| Phase 2 | Python minimum version below 3.13 and `typing_extensions` not a dependency | **Adjust**: use `warnings.warn(..., DeprecationWarning, stacklevel=2)` inside the function body instead. |
| Phase 3 | Existing tests fail because warnings are errors (`-W error` or `filterwarnings = error`) | **Adjust**: add a targeted filter for that exact message to those tests; never remove the global error setting. |
| Phase 3 | Removal requested in a MINOR release | **Stop**: removal of public API requires a MAJOR version; return to the user. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
