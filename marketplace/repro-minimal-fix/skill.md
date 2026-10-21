# Minimal Fix at the Defect Link

**One-line description:** Writes the smallest source change at the confirmed defect link that turns the red regression test green, one file at a time, without touching the test, weakening assertions, catching and swallowing the error, or special-casing the test input.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_cause` (object, required): Output of `repro-root-cause-confirm`.
- `regression_test` (object, required): Output of `repro-red-test-gate`.
- `repo_path` (string, required): Absolute path to the local clone.
- `stack` (string, required): One of `python`, `node`, `go`, `java`, `rust`, `cpp`.

---

## Outputs

- `fix_diff` (object): The unified diff of source changes only (`git diff -- <source paths>`), the branch name, the commit SHA, and a per-hunk note tying it to a link in the causal chain.
- `green_run_log` (object): Output of the regression test after the fix, showing it passes, plus the output of the stack's linter or type checker on the changed files.

---

## Phase 1: Design the Change

### Entry Criteria
- `root_cause` predictions all matched.
- Regression test is red at HEAD.

### Actions
1. Create a branch: `git switch -c fix/<short-defect-name>`.
2. State the change in one sentence at the defect link, using this table to choose the shape:

| `root_cause` class | Fix shape | Forbidden shape |
|---|---|---|
| missing-case | Handle the missing input class where the contract says it is handled | Checking for the exact test input value |
| off-by-one | Correct the comparison or index | Adding `+1`/`-1` at the symptom site |
| wrong-assumption | Make the order, zone or type explicit (sort with a key, pass a zone, validate the type) | Retrying until it works |
| state-lifecycle | Initialize at construction, or guard use with the documented lifecycle | Null checks at the crash site that return a default silently |
| concurrency | Protect the shared state with the project's existing primitive (mutex, channel, atomic, lock) | `sleep`, retries, or reducing parallelism in tests |
| integration | Align the caller to the callee's documented contract (or the reverse when the callee is ours and wrong) | Wrapping in `try/except` / `catch` and ignoring |
| config | Fix the default or precedence at the place it is resolved | Overriding in the test's setup |

3. List the files you will change. If more than one file is needed, order them so each step compiles and the test can run after each.

### Output
One-sentence change and ordered file list.

### Quality Gate
- The chosen shape is the "Fix shape" column of the row for `root_cause` class, and no planned edit matches the "Forbidden shape" column.

---

## Phase 2: Apply One File at a Time

### Entry Criteria
- Change designed.

### Actions
1. Edit the first file only. Keep the change within the function at the defect link unless the design requires otherwise.
2. Do not edit the regression test file. Do not edit any other test. Do not edit fixtures. Check with `git diff --name-only`; only source files appear.
3. Do not reformat unrelated lines; run the formatter only on changed files and only if the repo uses one (`black <file>` / `ruff format <file>`, `prettier --write <file>`, `gofmt -w <file>`, `cargo fmt -- <file>`, `clang-format -i <file>` with the repo's `.clang-format`; Java: the repo's Spotless or formatter plugin).
4. Run the regression test with its exact command from `regression_test`. Record the output.
5. If more files are planned, repeat for the next file. If the test is green after a file, stop editing.
6. Do not invent APIs. Every function, method or flag you call must already exist in the repo (`git grep -n "<name>"`) or in the documentation of the dependency version pinned in the lock file.

### Output
Source changes and test output.

### Quality Gate
- `git diff --name-only` contains no test or fixture paths.
- The regression test output shows a pass: pytest `1 passed`, Jest/Vitest `1 passed`, node:test `# pass 1`, Go `--- PASS: TestName` and `ok`, Maven `Tests run: 1, Failures: 0, Errors: 0`, Gradle `BUILD SUCCESSFUL` with the test listed, Rust `test result: ok. 1 passed`, GoogleTest `[  PASSED  ] 1 test`.

---

## Phase 3: Static Checks and Commit

### Entry Criteria
- Regression test is green.

### Actions
1. Run the stack's static checks on changed files, only tools the repo already configures:

| `stack` | Commands (use those present in the repo config) |
|---|---|
| python | `ruff check <files>`, `mypy <files>` or `pyright <files>` |
| node | `npx eslint <files>`, `npx tsc --noEmit -p .` |
| go | `go vet ./<pkg>`, `staticcheck ./<pkg>` |
| java | `./mvnw -q compile` with the repo's Checkstyle/SpotBugs goals if configured |
| rust | `cargo clippy --locked -- -D warnings` only if CI uses it; else `cargo clippy --locked` |
| cpp | the repo's `clang-tidy` config: `clang-tidy -p build-repro <files>` |

2. Compare with the same checks on the base commit; only new findings in changed lines must be fixed.
3. Commit: test and fix together or as two commits per repo convention (`git log --oneline -20` shows the convention). Message: `fix(<area>): <behavior> (#<issue>)` if the repo uses Conventional Commits, else match recent messages.
4. Record `fix_diff` with `git show --stat HEAD` and `git diff <base>..HEAD -- <source paths>`.

### Output
`fix_diff`, `green_run_log`.

### Quality Gate
- Static checks report no new findings on changed lines (paste the before and after outputs).
- `git status --porcelain` is empty after commit.

---

## Worked Example

Illustrative only. `root_cause` class missing-case at `src/importer/encoding.py:19`.

- Phase 1: branch `fix/utf16-bom-detection`. Change: "Recognize `codecs.BOM_UTF16_LE` and `codecs.BOM_UTF16_BE` before falling back to UTF-8." One file.
- Phase 2: diff adds two `startswith` checks returning `"utf-16"`. `python -m pytest tests/importer/test_csv_reader.py::test_read_rows_utf16_bom_decodes_header` prints `1 passed in 0.18s`.
- Phase 3: `ruff check src/importer/encoding.py` prints `All checks passed!`; `mypy` same count as base. Commit `fix(importer): detect UTF-16 byte order marks (#4123)`.

---

## Exit Criteria

DONE when the regression test passes, only source files changed, static checks have no new findings, and the change is committed on a fix branch.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Fix needs an API change visible to users | **Return**: report it with the minimal internal alternative; API changes need maintainer agreement. |
| Phase 2 | Test still red after the planned files | **Return**: to `repro-root-cause-confirm`; the chain is incomplete. Do not widen the change by guessing. |
| Phase 2 | Weak model edits the test to match buggy output | **Stop**: `git checkout -- <test file>`; the test encodes the expected behavior and is fixed. |
| Phase 2 | Weak model wraps the failing call in try/catch | **Stop**: revert; that hides the symptom and the forbidden-shape column applies. |
| Phase 3 | Linter reports pre-existing issues | **Adjust**: leave them; fix only findings on changed lines. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
