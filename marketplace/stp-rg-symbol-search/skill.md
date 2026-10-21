# Locate Definitions and Uses with ripgrep

**One-line description:** Finds where the goal's functions, types, error strings and config keys are defined and used, with exact `rg` patterns per language for definitions versus call sites, ignore-file behavior, literal versus regex search, and a `git grep` fallback, producing a short table of `file:line` hits instead of a pile of opened files.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `goal_check` (object, required): From `stp-goal-to-runnable-check`.
- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node`, `go`, `rust` or `java`.

---

## Outputs

- `symbol_hits` (object[]): `[{ "term": str, "kind": "definition"|"use"|"test"|"literal", "file": str, "line": int, "text": str }]`.

---

## Phase 1: Pick the Search Terms

### Entry Criteria
- `goal_check.goal_sentence` is filled in.

### Actions
1. Extract terms from `goal_check.goal_sentence` and `goal_check.command`, in this priority:
   1. Exact error text or wrong output, copied verbatim (search it as a literal).
   2. Function, method, class, type, CLI flag, endpoint or config key names written in code font or with `()`.
   3. File names.
2. Do not search for plain English words ("price", "error", "user") alone; they match thousands of lines. Combine them with a name from step 1.2 or restrict by path.
3. Keep the terms in a list; `stp-context-read-budget` writes them into the scratch log with the hits.

### Output
Ordered list of terms.

### Quality Gate
- Every term is either copied verbatim from the request or is a code identifier from it.

---

## Phase 2: Run the Searches

### Entry Criteria
- At least one term.

### Actions
1. Confirm `rg --version` exits 0. If `rg` is missing, use `git grep -n` with the same patterns (`git grep -n -w <name>`; `-F` for literals; `-E` for extended regex). `git grep` searches tracked files only.
2. Literal text (error messages, strings with `(`, `.`, `[`, `*`, `$`): `rg -n -F "<text>"`. Without `-F`, those characters are regex syntax.
3. A term that starts with `-` (a CLI flag): `rg -n -F -e "--dry-run"`. Without `-e`, rg reads it as its own flag.
4. Definitions, by stack (replace NAME):

| `stack` | Definition pattern | Type filter |
|---|---|---|
| python | `rg -n "^\s*(async\s+)?def NAME\b\|^\s*class NAME\b\|^NAME\s*="` | `-t py` |
| node | `rg -n "function\s+NAME\b\|(const\|let\|var)\s+NAME\s*=\|class\s+NAME\b\|NAME\s*\([^)]*\)\s*\{\|export\s+(type\|interface)\s+NAME\b"` | `-t ts -t js` |
| go | `rg -n "^func (\([^)]*\) )?NAME\(\|^type NAME\b\|^\s+NAME\s+=\|^(var\|const) NAME\b"` | `-t go` |
| rust | `rg -n "fn NAME\b\|(struct\|enum\|trait\|type\|const\|static\|mod) NAME\b\|macro_rules!\s*NAME"` | `-t rust` |
| java | `rg -n "(class\|interface\|enum\|record)\s+NAME\b\|\s+NAME\s*\([^;]*\)\s*(throws [^{]+)?\{"` | `-t java` |

   In these patterns `\|` is shown escaped only because this is a Markdown table; type a plain `|` in the shell.
5. Uses: `rg -n -w NAME -t <type>`. `-w` matches whole words, so `parse` does not match `parse_args`.
6. Tests that mention the term: add `-g` globs: Python `-g "test_*.py" -g "*_test.py"`, Node `-g "*.test.*" -g "*.spec.*"`, Go `-g "*_test.go"`, Rust search `tests/` and `#[cfg(test)]` blocks, Java `-g "src/test/**"`.
7. Too many hits to read: count first with `rg -c -w NAME -t <type>` (per-file counts), then narrow by directory (`rg -n -w NAME src/pricing/`). Generated and vendored code is excluded with `-g "!vendor/**" -g "!dist/**" -g "!build/**" -g "!target/**" -g "!node_modules/**"`.
8. Know what rg skips by default: files ignored by `.gitignore`/`.ignore`/`.rgignore`, hidden files and directories, and binary files. If a file you expect is missing from results, re-run with `-uu` (search ignored and hidden files) and record that the hit is in an ignored file.

### Output
Raw hits.

### Quality Gate
- Each hit has a file path and line number from `rg -n` output (format `path:line:text`).
- At least one `definition` hit exists for every function or type name term, or the term is recorded as "no definition in repo" (it is external; it goes to the API check flows).

---

## Phase 3: Build the Hit Table

### Entry Criteria
- Raw hits exist.

### Actions
1. Convert each hit to a `symbol_hits` row. `kind` is `definition` if it matched the definition pattern, `test` if the file matched a test glob, `literal` for error-string matches, else `use`.
2. Drop rows inside `vendor/`, `node_modules/`, `dist/`, `build/`, `target/`, `.venv/`, and generated files (names ending `_pb2.py`, `.pb.go`, `.generated.ts`, or with a first line containing `Code generated` / `DO NOT EDIT`).
3. Sort rows: definitions first, then tests, then uses, then literals.

### Output
`symbol_hits`.

### Quality Gate
- No row path contains `vendor/`, `node_modules/`, `dist/`, `build/`, `target/` or `.venv/`.
- Every `text` field is copied from rg output, not retyped.

---

## Worked Example

Illustrative only.

`stack` = python, terms: `slugify`, literal `crme-brle` (wrong output).

```
$ rg -n "^\s*(async\s+)?def slugify\b" -t py
slugkit/core.py:14:def slugify(text: str, sep: str = "-") -> str:
$ rg -n -w slugify -t py
slugkit/__init__.py:1:from .core import slugify
slugkit/cli.py:22:    print(slugify(args.text))
tests/test_slugify.py:3:from slugkit import slugify
tests/test_slugify.py:7:    assert slugify("Hello World") == "hello-world"
$ rg -n -F "crme-brle"
(no output)
```

`symbol_hits`: one definition (`slugkit/core.py:14`), two uses, two test rows; the literal has no hits, which is recorded (the wrong output is produced at runtime, not stored).

---

## Exit Criteria

DONE when every term has a definition hit or an "external" note, and `symbol_hits` contains only first-party, non-generated files.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Request has no identifiers or literal text | **Adjust**: search the test directory for the feature noun restricted by `-t`; record the weak basis. |
| Phase 2 | `regex parse error` from rg | **Retry**: switch to `-F` for literals, or escape the special character. |
| Phase 2 | Name defined in more than one place | **Return**: keep all definition rows; `stp-context-read-budget` decides which one the goal uses by following imports. |
| Phase 2 | Expected file never appears | **Retry**: with `-uu`; if still absent, record "not in repo". |
| Phase 3 | Every hit is in generated code | **Stop**: the real source is the generator input; report it and the generator command. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
