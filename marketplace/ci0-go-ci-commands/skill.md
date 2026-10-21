# Go CI Build, Vet and Test Commands

**One-line description:** Writes the exact Go module CI commands (download and verify, gofmt check, go vet, go build, go test with the race detector, optional staticcheck or golangci-lint) and a gotestsum JUnit XML report.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository checkout.
- `stack_profile` (object, required): From `ci0-detect-stack`; `stack` must be `go`.

---

## Outputs

- `go_ci_commands` (object): `{setup[], install[], lint[], build[], test[], junit_path, notes[]}`.

---

## Phase 1: Module Download and Hygiene

### Entry Criteria
- `go.mod` exists at the root recorded in `stack_profile`.

### Actions
1. Read the Go version: `grep -E '^(go|toolchain) ' go.mod`. The `go` line is the minimum version; a `toolchain` line names the preferred toolchain. Record both in `notes[]`.
2. Install step: `go mod download` then `go mod verify` (verify checks downloaded modules against `go.sum` hashes; output `all modules verified` means success).
3. Tidy check, chosen by Go version:

| `go version` output | Tidy check command |
|---|---|
| go1.23 or later | `go mod tidy -diff` (exits non-zero and prints a diff when go.mod or go.sum is untidy) |
| earlier | `go mod tidy && git diff --exit-code go.mod go.sum` |

4. Format check: `test -z "$(gofmt -l .)"`. `gofmt -l` prints files that need formatting and exits 0 even when it finds some, so the `test -z` wrapper is required. Do not write `gofmt -l .` alone.
5. Run each command and record exit codes.

### Output
`setup[]`, `install[]`, and the format and tidy entries of `lint[]`.

### Quality Gate
- `go mod verify` printed `all modules verified`.
- The format check uses `test -z "$(gofmt -l .)"` and its exit code is recorded.

---

## Phase 2: Vet, Static Analysis and Build

### Entry Criteria
- Phase 1 commands recorded.

### Actions
1. Add `go vet ./...` (always available, no install).
2. Add third-party linters only if configured in the repo:

| File present | Command |
|---|---|
| `.golangci.yml`, `.golangci.yaml` or `.golangci.toml` | `golangci-lint run` (in GitHub Actions use the `golangci/golangci-lint-action` with the version pinned in the config or Makefile) |
| `staticcheck.conf` or `staticcheck` in Makefile or `tools.go` | `go run honnef.co/go/tools/cmd/staticcheck@<version from repo> ./...` |
| neither | none; note "no linter configured" |

3. Add `go build ./...`. For a project with build tags, list tags from `grep -rhoE '^//go:build .*' --include='*.go' . | sort -u` and record them; ask the user which tag sets CI must build.
4. Run each command. Do not change code to silence vet in this flow.

### Output
`lint[]` and `build[]`.

### Quality Gate
- `go vet ./...` and `go build ./...` were run and exit codes recorded.
- Every linter command matches a config file shown in the table lookup.

---

## Phase 3: Tests With Race Detector and JUnit

### Entry Criteria
- Build succeeded.

### Actions
1. Base command: `go test -race -count=1 ./...`. `-count=1` disables the test result cache so CI always executes tests; `-race` requires cgo, so the job needs `CGO_ENABLED=1` and a C compiler (present on GitHub-hosted Ubuntu runners and the `golang` Docker images; Alpine images need `apk add build-base`).
2. If cgo is unavailable on the target runner, drop `-race` and record "race detector disabled: no cgo" in `notes[]`. Never drop it for speed alone without the user's decision.
3. JUnit: use gotestsum, which wraps `go test`: `go run gotest.tools/gotestsum@<pinned version> --junitfile reports/junit.xml --format testname -- -race -count=1 ./...`. Pin a version (check the latest release on the gotestsum GitHub page); never use `@latest` in CI.
4. Coverage, if wanted: add `-coverprofile=coverage.out -covermode=atomic` after `--`; `atomic` is required with `-race`.
5. Run the command. Count cases: `grep -c '<testcase' reports/junit.xml`.
6. Do not add `-short` unless the project's Makefile already uses it in CI; it silently skips tests guarded by `testing.Short()`.

### Output
`go_ci_commands`.

### Quality Gate
- `grep -c '<testcase' reports/junit.xml` prints a number greater than 0.
- The test command includes `-count=1`, and includes `-race` or a recorded reason in `notes[]`.

---

## Worked Example

Illustrative only. `go.mod` has `go 1.22.5`; repo has `.golangci.yml`.

Phase 1: `go version` prints `go1.22.5 linux/amd64`, so the tidy check is `go mod tidy && git diff --exit-code go.mod go.sum` (exit 0). `go mod verify` prints `all modules verified`. `test -z "$(gofmt -l .)"` exits 0.
Phase 2: `go vet ./...` exits 0; `golangci-lint run` prints `internal/store/pg.go:88:2: ineffectual assignment to err (ineffassign)` and exits 1, recorded as pre-existing.
Phase 3:
```
$ go run gotest.tools/gotestsum@v1.12.0 --junitfile reports/junit.xml --format testname -- -race -count=1 ./...
PASS internal/store.TestInsertInvoice (0.04s)
...
DONE 318 tests in 22.481s
$ grep -c '<testcase' reports/junit.xml
318
```

---

## Exit Criteria

DONE when every command in `go_ci_commands` was run once with its exit code recorded and the JUnit report contains at least one test case.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `go mod verify` reports a mismatch | **Stop**: a module hash differs from `go.sum`; report it as a supply-chain issue. |
| Phase 1 | Private modules fail to download | **Adjust**: set `GOPRIVATE` to the module path prefix and record the credential the CI job needs. |
| Phase 2 | golangci-lint version differs from local | **Adjust**: pin the version the repo documents; report if none is documented. |
| Phase 3 | `-race requires cgo` error | **Adjust**: set `CGO_ENABLED=1` and install a C compiler; drop `-race` only with a recorded reason. |
| Phase 3 | Race detector reports `WARNING: DATA RACE` | **Return**: report the test and stack; never remove `-race` to hide it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
