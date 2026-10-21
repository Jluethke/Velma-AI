# Read Only the Files the Goal Needs, as Line Slices

**One-line description:** Chooses the smallest set of files to read from the search hits using a fixed decision table (definition, its test, one caller, imports), reads them as numbered line ranges rather than whole files, and records every fact the edit will rely on as a quoted `file:line` note, so the model edits from evidence instead of memory.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `symbol_hits` (object[], required): From `stp-rg-symbol-search`.
- `goal_check` (object, required): From `stp-goal-to-runnable-check`.
- `scratch_log` (string, required): Path from `stp-scratch-log-start`.

---

## Outputs

- `context_notes` (object[]): `[{ "fact": str, "file": str, "lines": "A-B", "quote": str }]`. Every fact has a verbatim quote.
- `target_files` (string[]): Files the edits may change, in the order they will be edited.

---

## Phase 1: Choose What to Read

### Entry Criteria
- `symbol_hits` has at least one row.

### Actions
1. Apply this table to the hits. Read a row's file only if its condition is true.

| Read | Condition | Which lines |
|---|---|---|
| Definition of the goal's main symbol | always | the whole function or class body, plus the import block at the top of the file |
| Test file for that symbol | always (if it exists) | the import block, one existing test as a style sample, and any fixture it uses |
| One caller | the goal changes a signature, return type or raised error | the calling function only |
| Definition of a helper the main symbol calls | the helper's name appears on a line you expect to change | that helper's body |
| Config file (`pyproject.toml`, `package.json`, `tsconfig.json`, `Cargo.toml`, `pom.xml`) | the goal mentions a setting, dependency or build flag | the relevant section |
| Anything else | never in this flow | none |

2. Never read: lockfiles (`*.lock`, `package-lock.json`, `pnpm-lock.yaml`, `go.sum`), generated code, `node_modules/`, `vendor/`, `target/`, `dist/`, minified files, or files over the context you can hold. If you need a fact from one of these, search it with `rg -n` for that fact only.
3. Write the reading list into `scratch_log` as `READ PLAN: <file> lines <A-B> because <table row>`.

### Output
Reading list.

### Quality Gate
- Every file on the reading list cites one table row.
- No lockfile, generated or vendored path is on the list.

---

## Phase 2: Read Line Slices

### Entry Criteria
- Reading list written.

### Actions
1. Find the slice bounds: the definition line from `symbol_hits` is the start. Find the end with the next definition in the same file: `rg -n "^(def |class |func |fn |pub fn |export |function )" <file>` (adjust to the stack) and take the next line number after the start, minus one.
2. Print the slice with line numbers:
   - bash: `sed -n '14,41p' <file> | cat -n` prints relative numbers; to keep real numbers use `awk 'NR>=14 && NR<=41 {printf "%d\t%s\n", NR, $0}' <file>`.
   - PowerShell: `Get-Content <file> | Select-Object -Skip 13 -First 28` and add 14 to the index shown, or `Select-String -Path <file> -Pattern '.' | Where-Object { $_.LineNumber -ge 14 -and $_.LineNumber -le 41 }`.
   - An editor or file-reading tool that takes an offset and limit is equal and preferred.
3. Read the import block separately: lines 1 to the last `import`/`from`/`use`/`require` line.
4. Do not re-read a file you already read unless an edit has changed it since.

### Output
Printed slices.

### Quality Gate
- Each slice printed shows real file line numbers.
- Each slice covers the whole body of its symbol (the first line is the definition, the line after the last is the next definition or end of file).

---

## Phase 3: Record Facts with Quotes

### Entry Criteria
- Slices read.

### Actions
1. For each fact the edit depends on, write a `context_notes` row. Required facts:
   - The exact signature of the main symbol (quote the line).
   - The line or lines that produce the wrong behavior, if visible (quote them).
   - How the test file imports the symbol and the assertion style it uses (quote one assertion).
   - Every import the edit will need that is already present (quote the import line). An import not present is NOT a fact; it goes to the API check.
2. A fact without a verbatim quote is not allowed. If you "remember" something about the code that you cannot quote, re-read the slice or drop the fact.
3. Fill `target_files`: the test file first (when the goal is a new test), then the source file with the wrong behavior, then any caller that must change. Use repo-relative paths.
4. Append `context_notes` and `target_files` to `scratch_log`.

### Output
`context_notes`, `target_files`.

### Quality Gate
- For every row, `rg -n -F "<quote>" <file>` returns a line inside `lines`.
- `target_files` is non-empty and each path exists (`test -f <path>` exits 0; for a new test file, its directory exists).

---

## Worked Example

Illustrative only.

Hits: definition `slugkit/core.py:14`, test `tests/test_slugify.py:7`.

- Phase 1: read `slugkit/core.py` 1-41 (imports and `slugify` body) and `tests/test_slugify.py` 1-8.
- Phase 2:
```
$ awk 'NR>=14 && NR<=22 {printf "%d\t%s\n", NR, $0}' slugkit/core.py
14	def slugify(text: str, sep: str = "-") -> str:
15	    text = text.lower()
16	    text = re.sub(r"[^a-z0-9]+", sep, text)
17	    return text.strip(sep)
```
- Phase 3: `context_notes`:
  - signature: `slugkit/core.py` 14-14, quote `def slugify(text: str, sep: str = "-") -> str:`
  - cause: `slugkit/core.py` 16-16, quote `text = re.sub(r"[^a-z0-9]+", sep, text)` (accented letters are not `a-z`, so they are removed before anything can fold them)
  - imports present: `slugkit/core.py` 1-1, quote `import re`
  - assertion style: `tests/test_slugify.py` 7-7, quote `assert slugify("Hello World") == "hello-world"`
  `target_files` = [`tests/test_slugify.py`, `slugkit/core.py`].

---

## Exit Criteria

DONE when every fact the edit needs is a quoted `file:line` note that `rg -F` can find, and `target_files` lists the files in edit order.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | The main symbol has several definitions | **Adjust**: follow the import in the test file or the caller to pick the one actually used; quote that import. |
| Phase 2 | Function body is longer than you can hold | **Adjust**: read the signature, the lines near the expected change, and the return statements; record the omitted range. |
| Phase 3 | A quote is not found by `rg -F` | **Retry**: re-read the slice and copy the line again (tabs and trailing spaces differ). |
| Phase 3 | The fix needs a file outside `scope_limits.in_scope` | **Return**: list it in `target_files` with the note "out of scope"; the stop flow decides. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
