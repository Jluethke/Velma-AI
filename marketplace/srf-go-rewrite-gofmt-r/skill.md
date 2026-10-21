# Go Expression Rewrite with gofmt -r

**One-line description:** Applies a mechanical Go expression rewrite across a module with `gofmt -r 'pattern -> replacement'`, where single lowercase letters are wildcards, after confirming the rewrite is type-safe and equivalent; lists matches with `-l`, previews with `-d`, writes with `-w` per package, and verifies with build, vet, tests and apidiff per commit.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Module root.
- `test_command` (string, required): Full suite command.
- `baseline_commit` (string, required): From `srf-baseline-green-check`.
- `codemod_spec` (object, required): The rewrite as `{"pattern": "bytes.Compare(a, b) == 0", "replacement": "bytes.Equal(a, b)"}` plus any exclusions.

---

## Outputs

- `step_commits` (string[]): One SHA per package batch.
- `step_log` (object[]): Per batch: files changed, build, vet, test and API results, SHA.

---

## Phase 1: Check the Rule Fits gofmt -r

### Entry Criteria
- `git status --porcelain` empty; `go build ./...` exits 0.

### Actions
1. Rules of `gofmt -r` (from `go doc cmd/gofmt`): pattern and replacement must each be a valid Go expression; single-character lowercase identifiers in the pattern are wildcards matching any subexpression and are substituted in the replacement. Matching is syntactic, without type information.
2. Decide with this table:

| Spec property | Decision |
|---|---|
| Both sides are expressions; no type condition needed | Use `gofmt -r`. |
| Must match statements (`if err != nil { return err }`) or blocks | Stop: use `srf-comby-structural-rewrite` or `srf-semgrep-autofix-rewrite`. |
| Correct only for certain types (for example `len(s) == 0` to `s == ""` only for strings) | Stop: syntactic match cannot check types; use gopls analyzers or semgrep with type metavariables, or rewrite by hand. |
| Package identifier is a single letter in your code (variable named `a` is fine; a package aliased `a` is not) | Rename wildcards are lowercase single letters; real single-letter identifiers in the pattern would become wildcards. Stop and restate. |
| Replacement needs a new import | `gofmt -r` does not add imports. Plan to run `goimports -w` on changed files afterwards. |

3. Confirm semantic equivalence: `bytes.Compare(a, b) == 0` and `bytes.Equal(a, b)` both treat nil and empty slices as equal (documented in package `bytes`). Write the doc reference in `step_log`. If you cannot cite equivalence, stop.

### Output
Approved rule with the equivalence citation.

### Quality Gate
- The rule passes every row of the table.
- An equivalence reference (package doc or language spec section) is recorded.

---

## Phase 2: List, Preview, Apply per Package

### Entry Criteria
- Phase 1 complete.

### Actions
1. List matching files: `gofmt -l -r 'bytes.Compare(a, b) == 0 -> bytes.Equal(a, b)' .`. Note: `gofmt -l` also lists files that are merely unformatted; first run `gofmt -l .` alone and confirm it prints nothing, so every listed file is a real match.
2. Preview: `gofmt -d -r 'bytes.Compare(a, b) == 0 -> bytes.Equal(a, b)' ./internal/report`. Read each hunk.
3. Exclude generated files: skip any file whose first lines contain `// Code generated ... DO NOT EDIT.` (`grep -l "Code generated" $(gofmt -l -r '...' .)`). Edit the generator instead or leave them.
4. Apply per package directory: `gofmt -w -r 'bytes.Compare(a, b) == 0 -> bytes.Equal(a, b)' ./internal/report`.
5. If imports changed, run `goimports -w <changed files>`.
6. Also apply the negated form if it exists in the spec (`bytes.Compare(a, b) != 0 -> !bytes.Equal(a, b)`) as a separate rule and separate commit.

### Output
Rewritten package.

### Quality Gate
- `gofmt -l .` prints nothing after the write.
- `git diff --stat` lists only files from the step 1 list in that package.

---

## Phase 3: Verify and Commit per Package

### Entry Criteria
- Phase 2 applied to one package.

### Actions
1. `go build ./... && go vet ./...`, the golden test command if any, `test_command`, and the `apidiff` check.
2. Green: `git commit -am "refactor: bytes.Compare == 0 to bytes.Equal in internal/report"`. Red: `git checkout -- ./internal/report`, read the failure, record the site as an exclusion.
3. Repeat Phase 2 steps 2 to 5 and this phase for each package.
4. Final: `gofmt -l -r '<rule>' .` prints nothing (or only excluded generated files).

### Output
`step_commits`, `step_log`.

### Quality Gate
- Every commit passes build, vet and tests.
- Final `-l` run prints only recorded exclusions.

---

## Worked Example

Illustrative only.
```
$ gofmt -l .
$ gofmt -l -r 'bytes.Compare(a, b) == 0 -> bytes.Equal(a, b)' .
internal/report/diff.go
internal/store/cache.go
$ gofmt -d -r 'bytes.Compare(a, b) == 0 -> bytes.Equal(a, b)' ./internal/report
-	if bytes.Compare(prev, cur) == 0 {
+	if bytes.Equal(prev, cur) {
$ gofmt -w -r 'bytes.Compare(a, b) == 0 -> bytes.Equal(a, b)' ./internal/report
$ go build ./... && go vet ./... && go test ./... -count=1
ok   example.com/app/internal/report  0.011s
```
Committed; repeated for `internal/store`.

---

## Exit Criteria

DONE when the rule is cited as equivalent, applied per package in green commits, and a final `-l` run finds no remaining matches outside recorded exclusions.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Rule needs type information | **Stop**: switch to semgrep or manual edits. |
| Phase 2 | `gofmt -r` reports `parsing pattern` error | **Adjust**: the pattern is not a valid expression; quote it in single quotes and fix syntax. |
| Phase 2 | Generated files match | **Adjust**: exclude them; record in `step_log`. |
| Phase 3 | `imported and not used` after rewrite | **Adjust**: run `goimports -w` on the file. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
