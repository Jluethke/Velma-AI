# Go PR Static Checks with vet, staticcheck and golangci-lint

**One-line description:** Builds the PR, runs `gofmt -l`, `go vet`, staticcheck and the repository's golangci-lint config limited to new issues with `--new-from-rev`, verifies `go.mod` and `go.sum` are tidy, and flags new `//nolint` directives and ignored errors on changed lines.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone with the PR head checked out.
- `base_branch` (string, required): PR target branch.
- `changed_files` (object[], required): Rename-aware file list.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `go_static_findings` (object[]): New build, vet, lint and module findings, written to `<findings_dir>/prr-go-static-checks.json`.

---

## Phase 1: Build and Format

### Entry Criteria
- At least one changed file ends in `.go`, or `go.mod`/`go.sum` changed.

### Actions
1. Record the toolchain: `go version` and the `go` and `toolchain` lines in `go.mod`. If `go.mod` requires a newer Go than installed, Go 1.21+ downloads it automatically unless `GOTOOLCHAIN=local` is set; note which toolchain actually ran.
2. Find changed packages: for each changed `.go` file take its directory, then `go list ./<dir>` to get the import path. Keep the list.
3. Build everything, including tests, so broken callers in other packages show up: `go build ./... && go vet ./...` (vet compiles test files too).
4. Format: `gofmt -l $(git diff --name-only --diff-filter=ACMR origin/<base_branch>...HEAD -- '*.go')`. Any file printed is unformatted. If the project uses `goimports` or `gofumpt` (check CI), run that tool's `-l` mode instead.
5. Module tidiness: `go mod tidy` then `git diff --exit-code go.mod go.sum`. A non-zero exit means the PR's module files are not tidy. Restore with `git checkout go.mod go.sum` after reading the diff. Do not commit to the author's branch.

### Output
Build, vet, format and tidy results with exit codes.

### Quality Gate
- `go build ./...` and `go vet ./...` exit codes are recorded.
- `git status --porcelain` is empty after the tidy check (you restored the files).

---

## Phase 2: Lint Only New Issues

### Entry Criteria
- `go build ./...` exited 0. If it failed, record the compiler errors as blocking findings and skip to Phase 3.

### Actions
1. If `.golangci.yml`, `.golangci.yaml` or `.golangci.toml` exists, run the repository config limited to issues introduced since the merge base:
   `golangci-lint run --new-from-rev=$(git merge-base origin/<base_branch> HEAD) ./...`
   Output lines look like `internal/cart/price.go:41:2: Error return value of 'tx.Rollback' is not checked (errcheck)`. Use `--output.json.path` (v2) or `--out-format json` (v1); check `golangci-lint run --help` for the installed major version before using either.
2. If no golangci config exists, run staticcheck directly on changed packages: `staticcheck <import paths>`. Lines look like `pkg/file.go:12:5: should use strings.EqualFold instead (SA6005)`. Then keep only lines on changed lines from the `git diff -U0` hunk headers.
3. Do not add linters or a config file. Use the repository standard.
4. Map checks to labels:

| Diagnostic | Label |
|---|---|
| Compile error, `go vet` report (for example `copylocks`, `printf`, `loopclosure`, `lostcancel`) | blocking |
| `errcheck` or `ineffassign`, staticcheck `SA*` (bugs) | blocking |
| staticcheck `S*` (simplifications), `ST*` (style) | nit |
| `gofmt -l` lists a changed file | blocking if CI checks formatting, else nit |
| `go mod tidy` changes files | blocking if CI checks it, else suggestion |

### Output
New lint diagnostics with labels.

### Quality Gate
- Each diagnostic is either from a `--new-from-rev` run or matched to a changed line.
- Every diagnostic has a check name in parentheses or a code (`SA1019`, `errcheck`).

---

## Phase 3: Audit Suppressions and Ignored Errors

### Entry Criteria
- Phase 2 complete.

### Actions
1. List added suppressions and discarded errors:
   `git diff -U0 origin/<base_branch>...HEAD -- '*.go' | grep -nE '^\+.*(//nolint|//lint:ignore|_ = [A-Za-z_.]+\(|_, _ = |, _ := .*\(|panic\()'`
2. Apply this table:

| Added line | Label |
|---|---|
| `//nolint` with no linter name or no reason after `//` | suggestion: write `//nolint:<linter> // <reason>` |
| `_ = f()` where `f` returns an error from I/O, DB, or `Close` on a writer | blocking: a write error is lost (for files opened for writing, `Close` reports flush failures) |
| `x, _ := strconv.Atoi(...)` on external input | blocking: invalid input silently becomes 0 |
| New `panic(` outside `main` or init-time setup | question |

3. Write `<findings_dir>/prr-go-static-checks.json` (fields `flow`, `category`="static", `file`, `line`, `evidence`, `proposed_label`, `fix`) and validate with `python -m json.tool`.

### Output
`go_static_findings`.

### Quality Gate
- Every finding's `evidence` is a verbatim tool line or diff line.
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. Changed: `internal/cart/price.go`, `go.mod`.

- Phase 1: `go build ./...` exit 0; `go vet ./...` prints `internal/cart/price.go:58:9: assignment copies lock value to c: cart.Cart contains sync.Mutex`; `gofmt -l` prints nothing; `go mod tidy` then `git diff --exit-code go.mod` exits 1 showing `golang.org/x/exp` no longer used.
- Phase 2: `golangci-lint run --new-from-rev=4e1f0a2 ./...` prints `internal/cart/price.go:73:12: Error return value of 'rows.Close' is not checked (errcheck)`.
- Phase 3: `+	qty, _ := strconv.Atoi(r.URL.Query().Get("qty"))` found: blocking.
- Findings: copylocks blocking, errcheck blocking, Atoi blocking, untidy go.mod suggestion (CI does not check it).

---

## Exit Criteria

DONE when the PR builds or its compile errors are recorded, vet, format, tidy and lint ran with the repository's configuration, only new issues are reported, and every finding quotes tool output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Build needs cgo or build tags | **Adjust**: copy `-tags` and `CGO_ENABLED` from CI and rerun. |
| Phase 1 | `go mod tidy` needs network and none is available | **Adjust**: skip tidy and record it as not checked. |
| Phase 2 | golangci-lint major version differs from CI | **Retry**: install the CI version (see the CI workflow's `version:` key) before trusting output. |
| Phase 2 | `--new-from-rev` reports nothing but the diff is large | **Adjust**: also run staticcheck on changed packages and filter to changed lines. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
