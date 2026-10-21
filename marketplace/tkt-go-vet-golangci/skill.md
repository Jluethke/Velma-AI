# Go Format, Vet and Lint (gofmt, go vet, golangci-lint)

**One-line description:** Runs gofmt (or goimports), `go vet ./...` and golangci-lint with the repository's config, limits lint findings to the ticket's changes with `--new-from-rev`, and fixes them without `//nolint` blankets or config edits.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `change_diff` (string, required): Output of `tkt-small-edit-loop`.
- `repo_profile` (object, required): Output of `tkt-repo-orient-detect`.

---

## Outputs

- `go_static_report` (object): Tools and versions, commands, findings split into `introduced` and `pre-existing`, `//nolint` directives added with reasons, final exit codes.

---

## Phase 1: Format

### Entry Criteria
- `go build ./...` succeeds on the branch.

### Actions
1. List changed Go files: `git diff --name-only --diff-filter=d <base>...HEAD -- '*.go'`.
2. Check formatting: `gofmt -l <changed files>`. It prints the name of every file whose formatting differs; no output means formatted. If CI uses goimports (`rg -n goimports .github .golangci*`), run `goimports -l <changed files>` instead; it also checks import grouping.
3. Fix: `gofmt -w <changed files>` or `goimports -w <changed files>`. If the repo sets a local import prefix (golangci `goimports` setting `local-prefixes`), pass it: `goimports -local example.com/billing -w <files>`.
4. Never run `gofmt -w .` on the whole repo; it reformats files outside the ticket if any were unformatted.

### Output
Formatted changed files.

### Quality Gate
- `gofmt -l <changed files>` (or `goimports -l`) prints nothing.

---

## Phase 2: go vet

### Entry Criteria
- Formatting clean.

### Actions
1. Run `go vet ./...` with the build tags CI uses (`go vet -tags=integration ./...`).
2. Read output: `internal/export/csv.go:58:2: fmt.Sprintf format %d has arg name of wrong type string` (analyzer `printf`). Other common analyzers: `copylocks` (a struct containing a `sync.Mutex` passed by value), `loopclosure`, `lostcancel` (a `context.WithCancel` cancel function not called on all paths), `unreachable`, `structtag`.
3. Fix each finding at its file:line. These are almost always real bugs; there is no suppression comment for `go vet`, so fix the code.
4. Rerun `go vet ./...` until it prints nothing and exits 0.

### Output
Clean `go vet`.

### Quality Gate
- `go vet ./...` (with CI tags) exits 0 with no output.

---

## Phase 3: golangci-lint on New Code

### Entry Criteria
- `go vet` clean.

### Actions
1. Find the config: `.golangci.yml`, `.golangci.yaml`, `.golangci.toml` or `.golangci.json`. A top-level `version: "2"` key means golangci-lint v2 config; check `golangci-lint --version` matches the major version the config expects and the version CI installs (read the `version:` input of `golangci/golangci-lint-action` in the workflow).
2. Run limited to your changes: `golangci-lint run --new-from-rev=<base> ./...`. This reports only issues in lines changed since `<base>`. Confirm the flag in `golangci-lint run --help` for your version.
3. Also run the full CI form once (`golangci-lint run ./...`) and classify any extra findings as `pre-existing` if they are outside your diff.
4. Read output: `internal/export/csv.go:63:12: Error return value of `w.Flush` is not checked (errcheck)`. The linter name is in parentheses.
5. Fix introduced findings by hand. Typical fixes: `errcheck` = handle or return the error (for `csv.Writer`, call `w.Flush()` then check `w.Error()`); `ineffassign` = remove the dead assignment; `staticcheck SA*` = follow the message; `govet shadow` = rename the inner variable.
6. `--fix` exists for linters that support autofix; review the diff after using it.
7. If a suppression is unavoidable, use the specific form with a reason: `//nolint:errcheck // Close error is irrelevant after a failed read`. Never use bare `//nolint`. Check whether the config enables `nolintlint`, which rejects directives without a linter name or reason.
8. Do not edit `.golangci.*` to disable linters or add exclusions.

### Output
`go_static_report`.

### Quality Gate
- `golangci-lint run --new-from-rev=<base> ./...` exits 0.
- `git diff <base>...HEAD | rg -n '^\+.*//nolint(\s|$)'` prints nothing (no bare nolint).
- `git diff --name-only <base>...HEAD` shows no `.golangci.*` change unless the ticket asked.

---

## Worked Example

Illustrative only.

```
$ gofmt -l internal/export/csv.go internal/api/handlers.go
internal/export/csv.go
$ gofmt -w internal/export/csv.go && gofmt -l internal/export/csv.go
$ go vet ./...
# example.com/billing/internal/export
internal/export/csv.go:58:2: fmt.Sprintf format %d has arg currency of wrong type string
$ (fix %d -> %s) go vet ./...
$ golangci-lint run --new-from-rev=origin/develop ./...
internal/export/csv.go:63:9: Error return value of `w.Write` is not checked (errcheck)
$ (fix: if err := w.Write(rec); err != nil { return fmt.Errorf("write csv row: %w", err) })
$ golangci-lint run --new-from-rev=origin/develop ./...
0 issues.
```

Report: 1 format fix, 1 vet fix (real bug: wrong verb), 1 errcheck fix, 0 nolint.

---

## Exit Criteria

DONE when changed files are gofmt-clean, `go vet ./...` is clean, golangci-lint reports zero issues on new code, and no bare `//nolint` or config edits were added.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | goimports not installed | **Adjust**: `go install golang.org/x/tools/cmd/goimports@latest` only if CI also installs it that way; else use gofmt. |
| Phase 3 | Local golangci-lint major version differs from config | **Stop**: install the version CI uses; v1 and v2 configs are not interchangeable. |
| Phase 3 | `--new-from-rev` reports nothing but CI fails | **Adjust**: CI may lint the full tree; run `golangci-lint run ./...` and compare. |
| Phase 3 | Linter timeout | **Retry**: rerun with `--timeout` set to the value CI uses (read it from the workflow or config). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
