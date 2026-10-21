# Docs Staleness Audit Against the Code

**One-line description:** Finds documentation that no longer matches the code by extracting every file path, CLI flag, environment variable and code identifier mentioned in the docs and checking each one against the repository with grep, producing a list of stale references with the line to fix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `doc_plan` (object[], required): Page plan from `dfc-audience-doctype-plan`; only pages with status `exists` or `wrong-type` are audited.

---

## Outputs

- `stale_references` (object[]): One row per reference that the code no longer supports: doc file, line number, the reference text, reference kind (path, flag, env var, identifier, command), and the grep command that returned nothing.
- `docs_gaps` (object[]): Public items present in code but mentioned in no doc page and covered by no generated reference: kind, name, defining file.

---

## Phase 1: Extract References From Docs

### Entry Criteria
- `doc_plan` lists at least one existing page.
- `git -C <repo_path> status` succeeds (the audit reads tracked files only).

### Actions
1. For each existing page in `doc_plan`, extract candidate references with these patterns (use `grep -n -o -E` so line numbers are kept):

   | Kind | Pattern (extended regex) | Example match |
   |---|---|---|
   | Inline code | `` `[^`]+` `` | `` `--max-depth` `` |
   | Long CLI flag | `--[a-z][a-z0-9-]+` | `--dry-run` |
   | Env var | `\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b` | `APP_LOG_LEVEL` |
   | Relative path | `\b[a-zA-Z0-9_./-]+\.(py|ts|js|go|rs|toml|yaml|yml|json|md)\b` | `src/config.py` |

2. Run one page at a time, for example: `grep -n -o -E -- '--[a-z][a-z0-9-]+' docs/usage.md`.
3. Discard references inside fenced blocks marked as output of third-party tools (for example a `pip install` log). Keep references inside blocks that show this project's commands.
4. De-duplicate per page, keeping the first line number.
5. Do NOT edit any doc page in this phase. This flow reports; fixes happen in the flow that owns the page.

### Output
Reference list per page with kind and line number.

### Quality Gate
- Every reference row has a page path and a line number that `sed -n '<line>p' <page>` prints containing the reference text.

---

## Phase 2: Check Each Reference Against the Code

### Entry Criteria
- Reference list exists.

### Actions
1. Check each reference with the command for its kind. A reference is stale only when the command returns no match:

   | Kind | Check command |
   |---|---|
   | Path | `git -C <repo_path> ls-files --error-unmatch <path>` (non-zero exit means missing) |
   | CLI flag | `grep -rn -F -- '<flag>' <repo_path>/src <repo_path>/cmd <repo_path>/bin 2>/dev/null` (adjust the directories to where the CLI parser lives) |
   | Env var | `grep -rn -F '<VAR>' <repo_path> --include='*.py' --include='*.ts' --include='*.js' --include='*.go' --include='*.rs'` |
   | Identifier | `git -C <repo_path> grep -n -w '<name>'` restricted to source directories |
   | Command | run `<command> --help` when the tool is installed; a non-zero exit or "unknown command" is stale |

2. When a flag is built dynamically (for example `f"--{name}"`), grep finds nothing; before recording it as stale, run the CLI's `--help` and search its output for the flag.
3. Record each stale reference with the exact check command used.
4. Do NOT mark a reference stale on a guess; every stale row must carry a check that returned nothing.

### Output
`stale_references`.

### Quality Gate
- Re-running the check command stored in any `stale_references` row returns no match (or a non-zero exit for path checks).

---

## Phase 3: Find Undocumented Public Items

### Entry Criteria
- `stale_references` complete.

### Actions
1. List public items by stack:
   - Python: names in `__all__` of each public package (`git grep -n '__all__'`).
   - Node: `exports` in `package.json` plus `export` statements in the entry file.
   - Go: list packages with `go list ./...`, then run `go doc -short <import/path>` per package (one line per exported symbol). `go doc` does not accept the `./...` pattern.
   - Rust: `pub` items reachable from `lib.rs`; `cargo doc --no-deps` then list `target/doc/<crate>/all.html`.
   - CLI: every subcommand and flag in `<tool> --help` output.
2. For each item, grep the docs directory (`grep -rn -w '<name>' docs README.md`). Items covered by a generated reference in `doc_plan` count as documented only for the reference type; record them as gaps when no tutorial or how-to mentions a top-level entry point.
3. Write `docs_gaps` rows for items with no mention.

### Output
`docs_gaps`.

### Quality Gate
- For any `docs_gaps` row, `grep -rn -w '<name>' docs README.md` prints nothing.

---

## Worked Example

Illustrative only. `doc_plan` contains `docs/usage.md` (exists).

Phase 1:
```
$ grep -n -o -E -- '--[a-z][a-z0-9-]+' docs/usage.md
14:--config
22:--strict
31:--no-color
```
Phase 2:
```
$ grep -rn -F -- '--no-color' src/
$ echo $?
1
$ tidyconf --help | grep -c -- '--no-color'
0
```
Row: `{page: docs/usage.md, line: 31, ref: "--no-color", kind: flag, check: "tidyconf --help | grep -- --no-color"}`. The flag was renamed `--color=never` in code.

Phase 3: `__all__` includes `load_schema`; `grep -rn -w load_schema docs README.md` prints nothing, so `docs_gaps` gets `{kind: function, name: load_schema, file: src/tidyconf/schema.py}`.

---

## Exit Criteria

DONE when every reference extracted from existing pages has been checked with a recorded command, and every public item without a doc mention is listed in `docs_gaps`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Docs are generated HTML only, no source pages | **Stop**: audit the source the HTML is built from; never audit build output. |
| Phase 2 | CLI is not installed, so `--help` cannot run | **Adjust**: install it in a virtual environment or container per the README, then rerun the check. |
| Phase 2 | Thousands of identifier references | **Adjust**: audit identifiers only on reference and how-to pages first, then tutorials. |
| Phase 3 | Public API surface is unclear (no `__all__`, no `exports`) | **Return**: report the missing export declaration as a gap and audit the top-level module only. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
