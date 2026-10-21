# Find the Go Verify Commands the Repo Already Uses

**One-line description:** Reads `go.mod`, `go.work`, the Makefile and CI to write the exact `go build`, `go vet`, `go test -run` and linter commands for this module, including the cache-busting and regex-anchoring details that stop a small model from reading a skipped test as a pass.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `goal_check` (object, required): From `stp-goal-to-runnable-check`.

---

## Outputs

- `go_verify_commands` (object): `{ "module_path": str, "compile_one": str, "test_one": str, "check_touched": [str], "full_suite": str, "collect_count": str, "sources": [str] }`.

---

## Phase 1: Read the Module Layout

### Entry Criteria
- `repo_path` contains `go.mod` or `go.work`.

### Actions
1. Read the `module` line of `go.mod`; store it as `module_path`. Read the `go` directive (for example `go 1.22`) and any `toolchain` line.
2. If `go.work` exists, list its `use` directories. Commands must run from a directory inside one of those modules.
3. Run `go version` and `go env GOFLAGS GOPATH GOMODCACHE`. A non-empty `GOFLAGS` (for example `-mod=vendor`) applies to every command; record it.
4. If a `vendor/` directory exists, the module builds from vendored sources; `go doc` and source lookups must read `vendor/`, not the module cache.

### Output
`module_path`, Go version, `GOFLAGS`.

### Quality Gate
- `go version` exits 0 and its version is at least the `go` directive in `go.mod` (if lower, the `toolchain` line or `GOTOOLCHAIN` decides; record it).

---

## Phase 2: Read What CI and the Makefile Run

### Entry Criteria
- Module layout known.

### Actions
1. Run `rg -n "go (build|test|vet)|golangci-lint|staticcheck|gofmt|goimports" .github Makefile magefile.go Taskfile.yml 2>/dev/null` and copy every hit into `sources` with `file:line`.
2. Note test flags CI uses: `-race`, `-tags <name>`, `-short`, `-shuffle`. Build tags matter: a file starting with `//go:build integration` is invisible unless `-tags integration` is passed.
3. Linter: use `golangci-lint run` only if `.golangci.yml`, `.golangci.yaml` or `.golangci.toml` exists or CI runs it; use `staticcheck ./...` only if CI runs it.

### Output
`sources`, CI test flags, linter choice.

### Quality Gate
- Every linter in `check_touched` appears in `sources`.

---

## Phase 3: Write the Four-Speed Command Set

### Entry Criteria
- Phase 2 complete.

### Actions
1. `compile_one`: `go build ./<pkgdir>/...` for the package of the touched file, plus `go vet ./<pkgdir>/...`. `go build` on a package also type-checks it; `go vet` adds checks such as printf format mismatches. To compile the test files too, use `go test -count=1 -run '^$' ./<pkgdir>` (runs zero tests but compiles them).
2. `test_one`: `go test ./<pkgdir> -run '^TestName$' -count=1 -v`.
   - `-run` takes a regular expression. Without `^` and `$`, `-run TestParse` also runs `TestParseURL`.
   - Subtests: `-run '^TestParse$/^empty_input$'`. Spaces in subtest names become underscores.
   - `-count=1` disables the test result cache; without it a cached `ok` can be printed for code you did not re-run (the line shows `(cached)`).
   - Add CI's `-tags` and `-race` if CI uses them. `-race` needs cgo (`CGO_ENABLED=1` and a C compiler).
3. `check_touched`: `gofmt -l <file>` (prints the file name if it is not formatted; empty output means formatted), plus the linter from Phase 2 scoped to the package: `golangci-lint run ./<pkgdir>/...`.
4. `full_suite`: CI's command, usually `go test ./...` with CI's flags.
5. `collect_count`: `go test -list '.*' ./...` prints test, benchmark, fuzz and example names per package; count lines starting with `Test`.
6. Write the trap table into the output:

| Output line | Meaning | Treat as |
|---|---|---|
| `ok  <pkg> 0.01s [no tests to run]` | the `-run` pattern matched nothing | FAIL of the check (wrong selector) |
| `?   <pkg> [no test files]` | package has no `_test.go` files | FAIL if you expected a test there |
| `ok  <pkg> (cached)` | result reused, code not re-run | re-run with `-count=1` |
| `FAIL <pkg> [build failed]` | compile error in package or tests | read compiler output above it |
| `--- FAIL: TestX` | the test ran and failed | read the `file_test.go:NN:` lines under it |

### Output
`go_verify_commands`.

### Quality Gate
- `test_one` contains `-count=1` and a `-run` pattern starting with `^` and ending with `$`.
- Running `test_one` with the goal's test does not print `[no tests to run]` once the test exists.

---

## Worked Example

Illustrative only.

Repo `/work/cfgload`: `go.mod` says `module github.com/acme/cfgload` and `go 1.22`; `.golangci.yml` exists; CI line `run: go test -race ./...`.

- Phase 1: `module_path` = `github.com/acme/cfgload`, `go version go1.22.5 linux/amd64`, `GOFLAGS` empty.
- Phase 2: `sources` = [`.github/workflows/ci.yml:24 go test -race ./...`, `.golangci.yml`].
- Phase 3:
```
compile_one:   go build ./internal/dur/... && go vet ./internal/dur/...
test_one:      go test ./internal/dur -run '^TestParseHours$' -count=1 -race -v
check_touched: gofmt -l <file> ; golangci-lint run ./internal/dur/...
full_suite:    go test -race ./...
collect_count: go test -list '.*' ./...
$ go test ./internal/dur -run '^TestParseHours$' -count=1 -race -v
testing: warning: no tests to run
PASS
ok      github.com/acme/cfgload/internal/dur    0.012s [no tests to run]
```
That is a selector miss, not a pass: the test does not exist yet.

---

## Exit Criteria

DONE when `go_verify_commands` contains anchored, uncached `test_one`, a package-scoped `compile_one`, and CI-sourced `full_suite`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `go: go.mod requires go >= X` | **Stop**: report the required toolchain; do not edit the `go` directive. |
| Phase 1 | `go: updates to go.mod needed` | **Stop**: the module graph is not tidy at baseline; do not run `go mod tidy` unasked. |
| Phase 2 | No CI and no Makefile | **Adjust**: use `go vet ./...` and `go test ./...`; mark `sources` "inferred". |
| Phase 3 | `-race requires cgo` | **Adjust**: drop `-race` from `test_one`, record it, keep it in `full_suite` for a machine with cgo. |
| Phase 3 | Test file has a build tag | **Adjust**: add `-tags <tag>` copied from the file's `//go:build` line. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
