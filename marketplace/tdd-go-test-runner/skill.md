# TDD Go Test Runner Setup

**One-line description:** Prepares a Go module for test-first work with the built-in go test tool, proves it passes and fails a canary, and records the package, single-test, subtest, cache-busting, race, shuffle and watch commands.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Root of the Go module (folder with `go.mod`), or a folder where one should be created.

---

## Outputs

- `runner_config` (object): `module_path`, `go_version`, `suite_command`, `single_test_command` (template), `subtest_command` (template), `watch_command`.
- `smoke_result` (object): Output lines and exit code for the canary pass run and fail run.

---

## Phase 1: Module Check

### Entry Criteria
- `go version` prints a version.

### Actions
1. In `project_dir`, if `go.mod` is missing, run `go mod init <module path>` using the repository URL path the user gives (for example `github.com/acme/billing`). Do not invent an import path; ask for it.
2. Run `go vet ./...` and `go build ./...`. Both must succeed before tests mean anything.
3. Rules to keep: test files end in `_test.go` and sit in the same directory as the code. Use `package billing` (white-box, same package) by default; use `package billing_test` (black-box) when testing only the exported API. Both may live in the same folder.

### Output
A building module.

### Quality Gate
- `go build ./...` exits 0.
- `go.mod` first line `module ...` matches `module_path`.

---

## Phase 2: Canary Pass and Fail

### Entry Criteria
- Module builds.

### Actions
1. Create `canary_test.go` in any package folder:

```go
package billing

import "testing"

func TestCanaryRunnerExecutesTests(t *testing.T) {
	got := 1 + 1
	if got != 2 {
		t.Errorf("got %d, want %d", got, 2)
	}
}
```

2. Run `go test -run '^TestCanaryRunnerExecutesTests$' -v ./...`. Expect `--- PASS: TestCanaryRunnerExecutesTests` and `ok` for the package, exit 0.
3. Change `want` to 3 in both places. Run again with `-count=1`. Expect `--- FAIL`, `got 2, want 3`, `FAIL` for the package, exit 1.
4. Delete `canary_test.go`. Record both runs.
5. Message convention: always write `got X, want Y` (the Go team's style). Use `t.Errorf` to keep checking, `t.Fatalf` only when later lines would panic (for example after a nil error check).

### Output
`smoke_result`.

### Quality Gate
- Pass run shows `--- PASS`; fail run shows `--- FAIL` and `got 2, want 3`.
- `canary_test.go` is deleted.

---

## Phase 3: Selection, Cache and Watch

### Entry Criteria
- Canary proved pass and fail.

### Actions
1. Record:

| Purpose | Command |
|---|---|
| All packages | `go test ./...` |
| Ignore cached results | add `-count=1` (output marked `(cached)` means the test did NOT run) |
| One test (regex, anchor it) | `go test ./billing -run '^TestInvoiceTotal$' -v` |
| One subtest | `go test ./billing -run '^TestInvoiceTotal$/^empty_cart$' -v` |
| Stop at first failure | add `-failfast` |
| Data race detector | add `-race` (needs cgo enabled on most platforms) |
| Random test order | add `-shuffle=on` (Go 1.17+); it prints the seed; rerun a failure with `-shuffle=<seed>` |
| List tests without running | `go test -list '.*' ./billing` |

2. Table-driven tests: define `tests := []struct{ name string; in X; want Y }{...}` and loop with `t.Run(tt.name, func(t *testing.T) {...})`. Name cases with underscores so `-run` matches them as written.
3. Watch mode: Go has none built in. Install `go install gotest.tools/gotestsum@latest` and run `gotestsum --watch`; check `gotestsum --help` for the installed version's flags. If install is not allowed, record "none".
4. Do NOT use `-run TestFoo` without `^...$` anchors; it also runs `TestFooBar`.

### Output
`runner_config`.

### Quality Gate
- `go test -count=1 ./...` runs with no `(cached)` lines.
- `go test -list '.*' ./...` exits 0.

---

## Worked Example

Illustrative only. Module `github.com/acme/billing`.

```
$ go test -count=1 -run '^TestCanaryRunnerExecutesTests$' -v ./...
=== RUN   TestCanaryRunnerExecutesTests
    canary_test.go:8: got 2, want 3
--- FAIL: TestCanaryRunnerExecutesTests (0.00s)
FAIL
FAIL	github.com/acme/billing	0.004s
```

`runner_config.subtest_command` = `go test ./{pkg} -run '^{Test}$/^{case}$' -v -count=1`.

---

## Exit Criteria

DONE when the module builds, a canary was seen passing and failing, it is removed, and the commands are recorded with anchored `-run` patterns.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `go: cannot find main module` | **Adjust**: run from the folder with `go.mod`, or `go mod init` with the user's module path. |
| Phase 2 | `testing: warning: no tests to run` | **Retry**: function must be `TestXxx(t *testing.T)` with Xxx not starting lowercase, in a `_test.go` file. |
| Phase 3 | `-race requires cgo` | **Adjust**: set `CGO_ENABLED=1` with a C compiler installed, or run without `-race` and record it. |
| Phase 3 | Results show `(cached)` after changing a data file or service the test reads (Go caches by source, flags and the env vars and files it tracked) | **Retry**: add `-count=1`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
