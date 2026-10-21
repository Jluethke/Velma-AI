# TDD Go Coverage With go cover

**One-line description:** Measures statement coverage of a Go module with go test -coverprofile and go tool cover, chooses the right -covermode and -coverpkg, reads the -func and -html outputs, and maps each uncovered block to a behavior, knowing Go measures statements and not branches.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `refactored_code` (object, required): Files and suite result from `tdd-refactor-under-green`.
- `coverage_floor` (number, optional): A minimum total percentage set by the user or project policy. When absent, no threshold is applied.

---

## Outputs

- `coverage_report` (object): Total percent, per-function percent from `go tool cover -func`, the profile path (`cover.out`), and the HTML path.
- `uncovered_lines` (object[]): Each uncovered block with file, line range, classification and action.

---

## Phase 1: Collect the Profile

### Entry Criteria
- `go test ./...` passes.

### Actions
1. Choose flags:

| Need | Flag |
|---|---|
| Normal run | `-covermode=set` (default without `-race`): was each statement run |
| Tests use `-race` or goroutines | `-covermode=atomic` (default when `-race` is set) |
| Count how often each statement ran | `-covermode=count` |
| Count coverage of package A from tests in package B (integration tests in another package) | `-coverpkg=./...` |

2. Run: `go test -count=1 -covermode=atomic -coverprofile=cover.out ./...` (drop `atomic` if not racing). Each package prints `coverage: 82.4% of statements`.
3. Packages with no test files print `? pkg [no test files]` and their code is missing from the profile unless `-coverpkg=./...` is used. Since Go 1.22 such packages report `coverage: 0.0% of statements` when listed; check your Go version's behavior with `go version`.
4. For binaries and integration runs (Go 1.20+): build with `go build -cover -o app`, run with `GOCOVERDIR=covdata ./app`, then `go tool covdata percent -i=covdata` and `go tool covdata textfmt -i=covdata -o=cover.out`.

### Output
`cover.out`.

### Quality Gate
- `cover.out` exists and its first line is `mode: set`, `mode: count` or `mode: atomic`.

---

## Phase 2: Read Function and Line Views

### Entry Criteria
- `cover.out` exists.

### Actions
1. Per function: `go tool cover -func=cover.out`. Each line: `file.go:LINE:  FuncName  PERCENT`. The last line `total: (statements) N%` is the total.
2. Per line: `go tool cover -html=cover.out -o coverage.html`, open it. Green = covered, red = not covered, grey = not tracked (declarations, comments).
3. Raw blocks: each line in `cover.out` is `file.go:startLine.startCol,endLine.endCol numStatements count`. A `count` of 0 is an uncovered block. List them: `grep ' 0$' cover.out`.
4. Go coverage is statement-based. A line `if a && b {` counts as covered when it ran once, even if `b` never mattered. Short-circuit and one-line conditions need separate table cases; coverage will not reveal them, mutation testing (`tdd-go-gremlins`) will.

### Output
Draft `uncovered_lines` from the zero-count blocks.

### Quality Gate
- Every zero-count block in files from `refactored_code` is in `uncovered_lines`.
- `go tool cover -func=cover.out | tail -1` total is recorded.

---

## Phase 3: Classify and Act

### Entry Criteria
- Draft list exists.

### Actions
1. Classify each block:

| Block is... | Classification | Action |
|---|---|---|
| `if err != nil { return ..., err }` after a call whose failure a requirement covers | missing behavior | inject a failing fake for that dependency and drive the error path |
| `if err != nil` after a call that cannot fail with these inputs (for example `bytes.Buffer.Write`) | defensive only | keep; note it |
| Function no caller uses | dead code | delete under green; `go vet` and `staticcheck` (if installed, check `U1000`) help confirm |
| `main()` wiring | excluded | keep thin; test the logic it calls |

2. Do not add tests that call a function only to raise the number; each new test must assert a result.
3. If `coverage_floor` is given, compare the total to it and record pass or fail. `go test` has no built-in threshold flag; extract the number with `go tool cover -func=cover.out | tail -1`. If not given, report without a verdict.

### Output
`coverage_report`, `uncovered_lines`.

### Quality Gate
- Every entry has a classification and an action.
- The floor comparison, if any, used only `coverage_floor`.

---

## Worked Example

Illustrative only. Module `example.com/cart`.

```
$ go test -count=1 -coverprofile=cover.out ./...
ok  	example.com/cart	0.004s	coverage: 87.5% of statements
$ go tool cover -func=cover.out
example.com/cart/cart.go:9:	Total		100.0%
example.com/cart/cart.go:18:	ApplyCoupon	66.7%
total:				(statements)	87.5%
$ grep ' 0$' cover.out
example.com/cart/cart.go:22.17,24.3 1 0
```

Phase 3: lines 22-24 return `ErrExpiredCoupon`. Requirement covers expired coupons: missing behavior, new row B08 with a fixed clock (`tdd-time-boundary`).

---

## Exit Criteria

DONE when a profile was collected with the right mode and package scope, every zero-count block is classified with an action, and any floor came from `coverage_floor`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Error saying `-covermode` must be `atomic` when `-race` is enabled | **Adjust**: use `-covermode=atomic`. |
| Phase 1 | Integration tests in `pkg_test` or another package do not count | **Adjust**: add `-coverpkg=./...`. |
| Phase 2 | HTML shows everything red | **Retry**: the profile is from another run or path; regenerate `cover.out` and reopen. |
| Phase 3 | Floor not met | **Return**: report the total and classified gaps; do not lower the floor. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
