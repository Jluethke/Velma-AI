# Swallowed Catch Inventory with ripgrep

**One-line description:** Builds a file-and-line inventory of swallowed errors, overly broad catches, lost causes and string-matched errors using exact ripgrep patterns per stack, with one row per hit and no edits to the code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `go`, `rust` or `typescript`.
- `boundary_map` (object, required): From `errh-boundary-map`. Used to tag hits that sit inside a boundary handler.

---

## Outputs

- `catch_inventory` (object[]): One row per hit: `{ id, pattern_id, file, line, snippet, at_boundary }`.

---

## Phase 1: Run Stack Patterns

### Entry Criteria
- `rg --version` prints a version.
- `boundary_map` exists.

### Actions
1. Exclude generated and vendored code on every command: add `-g '!vendor/**' -g '!node_modules/**' -g '!**/*_pb2.py' -g '!target/**' -g '!dist/**'`.
2. Confirm the type filter covers your extensions: `rg --type-list | rg "^(py|go|rust|ts):"`. If `.tsx` or `.mts` is missing from `ts`, add `-g '*.tsx'`.
3. Run every row for `stack`. `-U` enables multiline; `--multiline-dotall` is not needed for these patterns. In the table, `\|` is Markdown table escaping: type a plain `|` (regex alternation) when you run the command, and wrap the pattern in single quotes in bash.

| pattern_id | stack | Command | What it finds |
|---|---|---|---|
| PY-BARE | python | `rg -n --type py "^\s*except\s*:"` | Bare `except:` (also catches `KeyboardInterrupt`, `SystemExit`) |
| PY-BROAD | python | `rg -n --type py "except\s+\(?\s*(Base)?Exception\b"` | `except Exception` and `except BaseException` |
| PY-PASS | python | `rg -n -U --type py "except[^\n]*:\s*\n\s*(pass\|\.\.\.\|continue)\s*$"` | Handler body that discards the error |
| PY-RETNONE | python | `rg -n -U --type py "except[^\n]*:\s*\n\s*return( None\| \[\]\| \{\}\| 0\| False)?\s*$"` | Error turned into a default value |
| PY-STR | python | `rg -n --type py "str\((e\|exc\|err\|ex)\)\s*(==\|in\b)\|in str\((e\|exc\|err\|ex)\)"` | Matching on error text |
| PY-SUPPRESS | python | `rg -n --type py "contextlib\.suppress\(\|suppress\(Exception"` | Suppression that may be too broad |
| PY-CANCEL | python | `rg -n --type py "except\s+(asyncio\.)?CancelledError"` | Cancellation caught (must re-raise) |
| GO-BLANK | go | `rg -n --type go "^\s*_\s*(,\s*_)?\s*=\s*[A-Za-z_][\w.]*\("` | Return value (often an error) discarded |
| GO-NILRET | go | `rg -n -U --type go "if err != nil \{\s*\n\s*return nil\s*\n\s*\}"` | Error checked then replaced with nil |
| GO-WRAPV | go | `rg -n --type go "fmt\.Errorf\([^)]*%[vs][^)]*\berr\b"` | Wrap with `%v`/`%s` loses the chain |
| GO-EQ | go | `rg -n --type go "err\s*[!=]=\s*[A-Za-z_.]*Err[A-Z]\w*"` | `==` on sentinel instead of `errors.Is` |
| GO-STR | go | `rg -n --type go "err\.Error\(\)\s*==\|strings\.Contains\(err\.Error\(\)"` | Matching on error text |
| GO-PANIC | go | `rg -n --type go "\bpanic\(\|log\.Fatal\|os\.Exit\("` | Process exit outside `main` |
| RS-UNWRAP | rust | `rg -n --type rust "\.unwrap\(\)\|\.expect\("` | Panic on error |
| RS-LETUND | rust | `rg -n --type rust "let _\s*=\s*"` | Discarded `Result` |
| RS-OK | rust | `rg -n --type rust "\.ok\(\);\|\.unwrap_or_default\(\)\|\.unwrap_or\("` | Error turned into a default |
| RS-MAPIGN | rust | `rg -n --type rust "map_err\(\|_\|"` | Source error dropped in `map_err` |
| RS-PANIC | rust | `rg -n --type rust "panic!\(\|todo!\(\|unimplemented!\("` | Explicit panics |
| TS-EMPTY | typescript | `rg -n -U --type ts "catch\s*(\([^)]*\))?\s*\{\s*\}"` | Empty catch block |
| TS-PEMPTY | typescript | `rg -n --type ts "\.catch\(\s*\(\s*\w*\s*\)\s*=>\s*(\{\s*\}\|undefined\|null)\s*\)"` | Promise rejection discarded |
| TS-CONSOLE | typescript | `rg -n -U --type ts "catch\s*\(\w+[^)]*\)\s*\{\s*\n?\s*console\.(log\|error\|warn)"` | Catch that only prints |
| TS-ANY | typescript | `rg -n --type ts "catch\s*\(\s*\w+\s*:\s*any\s*\)"` | `any` in catch hides the type |
| TS-THROWSTR | typescript | `rg -n --type ts "throw\s+['\"\x60]"` | Throwing a string (no stack, no `cause`) |
| TS-VOID | typescript | `rg -n --type ts "^\s*void\s+\w[\w.]*\("` | Floating promise marked with `void` |

4. Save each command's raw output to the run record before reading it.

### Output
Raw hits per pattern.

### Quality Gate
- Every pattern row for `stack` was run; its hit count (`rg -c ... \| awk -F: '{s+=$2} END {print s}'` or the line count) is recorded, including zeros.
- Raw output is saved, not summarized.

---

## Phase 2: Normalize and Tag

### Entry Criteria
- Raw hits saved.

### Actions
1. Create one row per hit: `id` (`<pattern_id>-<n>`), `pattern_id`, `file`, `line`, `snippet` (the matched line plus the next 3 lines, read with `rg -n -A3` or by opening the file).
2. Set `at_boundary: true` when the file and line fall inside a handler listed in `boundary_map.boundaries[].current_handler`. A broad catch at a boundary is usually correct; the triage flow decides.
3. Delete exact duplicate rows (same file and line from two patterns): keep the first `pattern_id` and append the second to a `also` field.
4. Do NOT edit any source file in this flow. Do NOT delete a hit because it "looks fine": triage decides.

### Output
`catch_inventory`.

### Quality Gate
- Row count equals the sum of Phase 1 hit counts minus the deduplicated rows, and the arithmetic is shown.
- `git -C <repo_path> status --porcelain` prints nothing (no files changed).

---

## Worked Example

Illustrative. `stack=go`, repo `/srv/billing`.

```
$ rg -n --type go "fmt\.Errorf\([^)]*%[vs][^)]*\berr\b" -g '!vendor/**'
internal/invoice/store.go:88:		return fmt.Errorf("load invoice %d: %v", id, err)
$ rg -n -U --type go "if err != nil \{\s*\n\s*return nil\s*\n\s*\}"
internal/sync/pull.go:41:	if err != nil {
internal/sync/pull.go:42:		return nil
internal/sync/pull.go:43:	}
```
Phase 2 rows: `GO-WRAPV-1 internal/invoice/store.go:88 at_boundary=false`, `GO-NILRET-1 internal/sync/pull.go:41 at_boundary=false`. Counts: GO-BLANK 6, GO-NILRET 1, GO-WRAPV 4, GO-EQ 3, GO-STR 1, GO-PANIC 2, total 17 rows. `git status --porcelain` empty.

---

## Exit Criteria

DONE when every pattern for `stack` ran, every hit is a row in `catch_inventory`, and the working tree is unchanged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rg: regex parse error` | **Adjust**: the shell ate a backslash or pipe; put the pattern in single quotes in bash, or use `rg -n -f patterns.txt` with one pattern per line. |
| Phase 1 | Zero hits across all patterns in a non-trivial repo | **Retry**: confirm the type filter and the globs did not exclude the source tree (`rg --files --type <t> \| head`). |
| Phase 1 | Thousands of hits from generated code | **Adjust**: add the generated directory to the `-g '!dir/**'` excludes and rerun; record the exclude. |
| Phase 2 | A file changed during the flow | **Stop**: revert with `git checkout -- <file>`; this flow is read-only. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
