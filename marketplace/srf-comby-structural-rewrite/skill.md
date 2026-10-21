# Structural Rewrite with comby

**One-line description:** Performs a language-aware structural search and replace with comby, whose `:[hole]` templates match balanced parentheses, brackets and strings for the chosen language matcher, previewing the diff by default, adding `-rule` constraints, applying in place per directory with `-i`, and committing each green batch.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `test_command` (string, required): Full suite command.
- `baseline_commit` (string, required): From `srf-baseline-green-check`.
- `codemod_spec` (object, required): Match and rewrite templates and exclusions, for example `{"match": "if err != nil { return err }", "rewrite": "if err != nil { return fmt.Errorf(\"load config: %w\", err) }", "scope": "internal/config"}`.
- `file_extension` (string, required): Language matcher and file filter, for example `.go`, `.py`, `.ts`, `.java`.

---

## Outputs

- `step_commits` (string[]): One SHA per directory batch.
- `step_log` (object[]): Per batch: match count, files changed, results, SHA.

---

## Phase 1: Install and Write the Template

### Entry Criteria
- `git status --porcelain` empty.

### Actions
1. Install comby. It ships for Linux and macOS (`bash <(curl -sL get-comby.netlify.app)` per comby.dev, or `brew install comby`). On Windows use WSL or the `comby/comby` Docker image. Confirm with `comby -version`.
2. Template syntax to use (from comby.dev docs):

| Syntax | Matches |
|---|---|
| `:[x]` | Any text, including balanced `()`, `[]`, `{}` and whole strings, lazily, within the current nesting level |
| `:[[x]]` | One identifier-like word (alphanumeric and `_`) |
| `:[x.]` | Alphanumeric plus punctuation, no whitespace (check docs for exact class) |
| `:[x\n]` | Up to end of line |
| `...` | Not special in comby; write a hole instead |

   Whitespace in a template matches any amount of whitespace, including newlines.
3. Rewrite in the spec is behavior-changing in the example above (it wraps errors). Refactoring requires behavior preservation. Apply this table:

| Rewrite | Allowed in this flow? |
|---|---|
| Changes only syntax with identical semantics (call style, argument order of a commutative pure function, API alias swap documented as identical) | Yes |
| Changes error text, log output, return values, or timing | No: that is a feature change. Stop and ask the user to approve it as a behavior change with test updates owned by them. |

4. Constrain matches with `-rule` where needed, for example `-rule 'where :[x] != "nil"'` or `where match :[args] { | ":[_],:[_]" -> true | ":[_]" -> false }`; read the rule language docs before writing match rules.

### Output
Validated match and rewrite templates.

### Quality Gate
- `comby -version` prints a version.
- The rewrite is classified as semantics-preserving by the table, with the reason recorded.

---

## Phase 2: Preview

### Entry Criteria
- Phase 1 complete.

### Actions
1. Count matches without changing files: `comby 'MATCH' 'REWRITE' .go -d internal -match-only -count` (check `comby -h` for `-match-only` and `-count` in your version).
2. Preview the diff (comby's default output is a diff and does not write files): `comby 'MATCH' 'REWRITE' .go -d internal -exclude-dir vendor,testdata`.
3. Read every hunk. For each, confirm the hole bound the intended text; a `:[x]` that swallowed a whole block or multiple arguments means the template is too loose. Tighten with `:[[x]]` or a `-rule`.
4. Save the preview to `/tmp/comby-preview.diff` for the log.

### Output
Match count and reviewed preview.

### Quality Gate
- Every hunk in the preview is marked intended; zero unintended hunks remain after tightening.

---

## Phase 3: Apply per Directory and Commit

### Entry Criteria
- Preview approved.

### Actions
1. Apply in place to one directory: `comby 'MATCH' 'REWRITE' .go -d internal/config -i`.
2. Run the stack formatter on changed files (`gofmt -w`, `black`/`ruff format`, `prettier --write`), only if the project uses it.
3. Run the stack build or typecheck, characterization tests, `test_command`, and the API check.
4. Green: `git commit -am "refactor(comby): <short description> in internal/config"`. Red: `git checkout -- internal/config`, tighten the template, return to Phase 2.
5. Repeat per directory. Finish with a preview run on the whole scope: it must produce no diff.

### Output
`step_commits`, `step_log`.

### Quality Gate
- Each batch commit passes build, tests and API check.
- Final preview prints no diff.
- `git status --porcelain` empty.

---

## Worked Example

Illustrative only. Go, semantics-preserving rewrite of `strings.Index(s, sub) >= 0` to `strings.Contains(s, sub)` (documented identical in package `strings`).
```
$ comby 'strings.Index(:[s], :[sub]) >= 0' 'strings.Contains(:[s], :[sub])' .go -d internal
------ internal/config/load.go
@@ -41,1 +41,1 @@
-	if strings.Index(line, "=") >= 0 {
+	if strings.Contains(line, "=") {
$ comby 'strings.Index(:[s], :[sub]) >= 0' 'strings.Contains(:[s], :[sub])' .go -d internal/config -i
$ go build ./... && go test ./... -count=1
ok   example.com/app/internal/config  0.010s
```

---

## Exit Criteria

DONE when every applied rewrite is semantics-preserving, reviewed in preview, committed per directory with green checks, and a final preview shows no remaining matches.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | comby unavailable on Windows | **Adjust**: run through WSL or `docker run --rm -v "$PWD":/src -w /src comby/comby ...`. |
| Phase 1 | Rewrite changes behavior | **Stop**: out of scope for a refactor; return to the user. |
| Phase 2 | Hole matches too much | **Adjust**: use `:[[x]]` or add a `-rule`. |
| Phase 3 | Tests fail | **Retry**: revert the directory, tighten the template. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
