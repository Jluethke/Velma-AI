# Go Module Setup and Test Baseline

**One-line description:** Confirms the Go toolchain against the `go` and `toolchain` directives in go.mod, downloads and verifies modules, builds every package, and runs `go test ./...` once with the race detector setting CI uses, recording each pre-existing failure by package and test name.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_profile` (object, required): Output of `tkt-repo-orient-detect` with `stack` containing go.

---

## Outputs

- `go_baseline_report` (object): Go version, module path(s), build result, test command, per-package ok/FAIL/no test files list, failing tests with first error line and classification, commit hash.

---

## Phase 1: Toolchain and Modules

### Entry Criteria
- `repo_profile.stack` includes go.

### Actions
1. Read the `go` line and any `toolchain` line in `go.mod` (for example `go 1.22.0`, `toolchain go1.22.5`). Run `go version`. With Go 1.21 or newer, the `go` command downloads the required toolchain automatically when `GOTOOLCHAIN` is `auto` (the default); check with `go env GOTOOLCHAIN`.
2. If `go.work` exists, the repo is a multi-module workspace; run commands from the workspace root and note each `use` directory.
3. Run `go mod download` then `go mod verify`. `go mod verify` prints `all modules verified` on success.
4. Check that `go.mod` and `go.sum` are tidy without changing them: on Go 1.23 or newer run `go mod tidy -diff` (prints a diff and exits non-zero if untidy). On older versions run `go mod tidy` and then `git diff --exit-code go.mod go.sum`, and restore with `git checkout -- go.mod go.sum` if it changed (that restore touches only these two files you just changed).
5. If the repo vendors (`vendor/modules.txt` exists), commands use `-mod=vendor` automatically when the `go` directive is 1.14 or higher; do not run `go mod vendor` during setup.

### Output
Verified module cache and tidy status.

### Quality Gate
- `go mod verify` printed `all modules verified`.
- `git status --porcelain` shows no change to `go.mod` or `go.sum`.

---

## Phase 2: Build and Test

### Entry Criteria
- Modules verified.

### Actions
1. Build everything: `go build ./...`. No output means success.
2. Compile tests without running them to catch build errors in `_test.go` files: `go vet ./...` compiles them too, but for a pure compile check use `go test -run '^$' ./...`.
3. Run the suite with CI's flags. Copy them from CI (commonly `-race`, `-count=1`, `-tags=<tags>`, `-timeout`). If CI is undocumented, run `go test -count=1 ./...`. `-count=1` disables the test result cache so you see a real run; a cached run prints `(cached)`.
4. Read the output. Each package prints one line: `ok  example.com/billing/tax 0.41s`, `FAIL example.com/billing/export 0.88s`, or `?   example.com/billing/cmd [no test files]`. Above a `FAIL` package line, `--- FAIL: TestName (0.00s)` names the test and the following indented lines give `file_test.go:42:` and the message.
5. For machine-readable results use `go test -json ./...` and read `"Action":"fail"` events, or pipe through `gotestsum` if the project uses it.
6. Rerun each failing test alone: `go test -count=1 -run '^TestName$' ./path/to/pkg`. Fails alone = `pre-existing`; passes alone = `order-dependent` (shared global state or parallel test interference).

### Output
Per-package results and failure list.

### Quality Gate
- `go build ./...` exit code recorded.
- Every `FAIL` line from the run appears in the failure list with its test name.

---

## Phase 3: Record the Baseline

### Entry Criteria
- Suite completed.

### Actions
1. Record the single-test command pattern: `go test -count=1 -run '^TestName$' ./pkg/path`, and for subtests `-run '^TestName$/^subcase$'`.
2. Write `go_baseline_report` with the commit hash from `git rev-parse --short HEAD`.

### Output
`go_baseline_report`.

### Quality Gate
- Report includes the exact flags used and the commit hash.
- Every failure is classified.

---

## Worked Example

Illustrative only.

```
$ head -5 go.mod
module example.com/billing
go 1.22.0
toolchain go1.22.5
$ go version
go version go1.22.5 linux/amd64
$ go mod download && go mod verify
all modules verified
$ go build ./...
$ go test -race -count=1 ./...
ok      example.com/billing/tax       0.41s
--- FAIL: TestExportCSV_Header (0.00s)
    export_test.go:42: header = "id,amount", want "id,amount,currency"
FAIL    example.com/billing/export    0.88s
?       example.com/billing/cmd/billd [no test files]
$ go test -count=1 -run '^TestExportCSV_Header$' ./export
FAIL
```

`go_baseline_report`: go1.22.5, 1 pre-existing failure `export.TestExportCSV_Header`, commit `c0ffee1`.

---

## Exit Criteria

DONE when modules verify without changing go.mod or go.sum, all packages build, the suite has run once with CI's flags, and every failure is classified with the commit hash.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `go mod verify` reports a mismatch | **Stop**: a checksum mismatch is a security signal; report it and do not edit `go.sum`. |
| Phase 1 | Private modules fail to download | **Adjust**: set `GOPRIVATE` to the module prefix CI uses and confirm git credentials; record it. |
| Phase 2 | `-race` fails because cgo is unavailable | **Adjust**: install a C compiler or run without `-race` and record that the baseline lacks race detection. |
| Phase 2 | Tests need build tags | **Adjust**: read `//go:build` lines in failing files and pass the matching `-tags` that CI uses. |
| Phase 2 | Test hangs until default timeout panic | **Return**: record the goroutine dump's top frame as the hanging test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
