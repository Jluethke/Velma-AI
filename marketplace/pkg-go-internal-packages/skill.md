# Go Internal Packages and Exported Identifiers

**One-line description:** Shrinks a Go module's importable surface by moving non-API packages under `internal/` and unexporting accidental identifiers, verified with `go list`, `go doc`, `go vet` and the test suite.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `public_api` (object[], required): From `pkg-public-api-inventory`; public packages and identifiers, and leaks with fixes.
- `project_dir` (string, required): Module root containing `go.mod`.

---

## Outputs

- `go_export_surface` (object): Importable package list (from `go list`), packages moved under `internal/`, identifiers unexported, deprecated identifiers kept, and pasted gate output.

---

## Phase 1: Map Importable Packages

### Entry Criteria
- `go build ./...` and `go test ./...` exit 0 before any change.

### Actions
1. Run `go list ./... | grep -v '/internal'`. Every line is a package other modules can import.
2. Know the rule: a package under a directory named `internal` can only be imported by code rooted at the parent of that `internal` directory. `example.com/m/internal/cache` is importable by `example.com/m/...` only.
3. Mark each listed package with its `public_api` verdict. `main` packages under `cmd/` are not importable library API (Go forbids importing `main` packages), so leave them where they are.

### Output
Importable package list with verdicts.

### Quality Gate
- The package list is the pasted output of `go list`.

---

## Phase 2: Move Leaked Packages Under internal/

### Entry Criteria
- At least one leaked package, or skip to Phase 3.

### Actions
1. Move one package per step: `git mv util internal/util`.
2. Rewrite its import path everywhere in the module with GNU sed: `grep -rl '"example.com/m/util"' --include=*.go . | xargs sed -i 's#"example.com/m/util"#"example.com/m/internal/util"#g'` (on macOS BSD sed, write `sed -i ''`). Do not use `gofmt -r` for this; its rewrite rules match expressions, not import paths. Then run `gofmt -w .` to restore import grouping.
3. Run `go build ./... && go vet ./... && go test ./...` after each move. Fix before moving the next.
4. If the package was importable in a released tag, do not move it in a minor or patch release. Keep it, add `// Deprecated: use X instead.` as its package doc comment's final paragraph, and schedule the move for the next major version.

### Output
Leaked packages moved or deprecated.

### Quality Gate
- `go build ./... && go vet ./... && go test ./...` exits 0 after the last move.
- `go list ./... | grep -v '/internal'` no longer lists any moved package.

---

## Phase 3: Unexport Accidental Identifiers

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. For each package, run `go doc -all <import path>` and read every capitalized identifier.
2. For each identifier marked `leak` that never shipped: rename to lower case with `gopls rename -w <file>:#<offset> <newName>` if gopls is installed, otherwise rename by hand in one package at a time. Run `go build ./...` after each.
3. For an exported struct field that leaked, unexporting it breaks callers that set it; treat a shipped field as `deprecate_first`.
4. Never change test assertions to make a rename compile; only change the identifier spelling inside tests.
5. Re-run `go doc -all` and confirm the leaked names are gone.

### Output
`go_export_surface`.

### Quality Gate
- `go doc -all <pkg>` output contains no identifier listed as a never-shipped leak.
- `go test ./...` exits 0.

---

## Worked Example

Illustrative. Module `github.com/acme/ratelimit`.

Phase 1:
```
$ go list ./... | grep -v '/internal'
github.com/acme/ratelimit
github.com/acme/ratelimit/clock
github.com/acme/ratelimit/testutil
```
`testutil` is a test helper package (leak, never shipped). `clock` is public.

Phase 2: `git mv testutil internal/testutil`, imports rewritten, `go test ./...` prints `ok github.com/acme/ratelimit 0.41s`.

Phase 3: `go doc -all github.com/acme/ratelimit` shows `func DebugDump(l *Limiter) string`, a leak that never shipped. Renamed to `debugDump`; `go doc` no longer lists it.

---

## Exit Criteria

DONE when every importable package and exported identifier is intended public API or a documented deprecation, and build, vet and tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Build or tests fail before changes | **Stop**: fix the baseline first. |
| Phase 2 | `use of internal package ... not allowed` | **Adjust**: the importer is outside the parent tree; move the `internal` directory up one level or keep the package public. |
| Phase 2 | Package already shipped | **Adjust**: deprecate instead of moving. |
| Phase 3 | Rename breaks a different package | **Adjust**: that package used the identifier; it was public API in practice; restore it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
