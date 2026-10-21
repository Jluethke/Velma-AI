# Prove Each Go API Exists in the Module Graph

**One-line description:** Checks every external Go identifier in the edit plan with `go doc` against the exact module versions in `go list -m`, the standard library of the installed toolchain, and the `go` directive in `go.mod`, so no invented function, method, struct field or too-new standard library call reaches the code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `edit_plan` (object[], required): From `stp-edit-plan-write`.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `go_api_evidence` (object[]): `[{ "symbol": str, "status": "FOUND"|"NOT_FOUND"|"WRONG_SIGNATURE"|"VERSION_GATED"|"NOT_IN_GRAPH", "module": str, "version": str, "evidence": str, "command": str }]`.

---

## Phase 1: Map Each Symbol to Its Module

### Entry Criteria
- `edit_plan` lists at least one external symbol.

### Actions
1. Run `go version` and read the `go` directive in `go.mod`. Code must compile on the `go` directive version, which can be older than your toolchain.
2. For each symbol, take its import path (`strings.CutPrefix` is import path `strings`; `errors.Join` is `errors`; `github.com/spf13/cobra.Command` is module `github.com/spf13/cobra`).
3. Standard library test: `go list std | rg -x "<import path>"` prints the path if it is standard library.
4. Third-party: `go list -m <module>` prints `module version` if the module is in the graph. An error `not a known dependency` means it is not required by `go.mod`: status `NOT_IN_GRAPH`. Adding it is out of scope.
5. If the repo vendors (`vendor/modules.txt` exists), confirm the package directory exists under `vendor/<import path>/`.

### Output
Import path, module and version per symbol.

### Quality Gate
- Each symbol has a version from `go list -m` output, or `std <go version>`, or status `NOT_IN_GRAPH`.

---

## Phase 2: Read the Declaration with go doc

### Entry Criteria
- Phase 1 done.

### Actions
1. Run from inside the module (so `go doc` resolves the module's versions): `go doc <import path>.<Name>`, for example `go doc strings.CutPrefix`. For a method: `go doc net/http.Client.Do`. For a struct field: `go doc -all <import path>.<Type>` and read the field list.
2. Read the output:
   - It starts with the declaration line, for example `func CutPrefix(s, prefix string) (after string, found bool)`. Compare parameter count, types and the number of return values with your `new_text`. A call that ignores a second return value without `_` is a compile error in an assignment like `a := f()` when `f` returns two values.
   - `doc: no symbol <Name> in package <path>` means it does not exist: `NOT_FOUND`.
   - Unexported names (lowercase) cannot be used from another package even if `go doc -u` shows them.
3. Standard library version gate: the Go docs at pkg.go.dev/<import path> show "added in go1.N" next to newer symbols. `go doc` source can also be read with `go doc -src <path>.<Name>`. If the symbol is newer than the `go` directive, mark `VERSION_GATED` (example: `strings.CutPrefix` was added in Go 1.20; `slices` and `maps` packages in Go 1.21).
4. Generic functions: the declaration shows type parameters, such as `func Contains[S ~[]E, E comparable](s S, v E) bool`. Confirm your argument types satisfy the constraint (here `E` must be `comparable`).
5. Interfaces: if `new_text` assigns a value to an interface type, run `go doc <path>.<Interface>` and confirm your type has every listed method with the same signature.

### Output
Status and quoted declaration per symbol.

### Quality Gate
- Each `FOUND` row quotes the declaration line printed by `go doc`.
- The argument count and return count in `new_text` match the quoted declaration.

---

## Phase 3: Report

### Entry Criteria
- All symbols checked.

### Actions
1. Emit `go_api_evidence`.
2. For non-`FOUND` rows, propose a verified alternative only after running `go doc` on it (for a `VERSION_GATED` `strings.CutPrefix` on Go 1.19: `strings.HasPrefix` plus `strings.TrimPrefix`, both checked).
3. Never trust memory for field names on third-party structs; they change between major versions and the major version is part of the import path (`/v2`, `/v3`).

### Output
`go_api_evidence`.

### Quality Gate
- Row count equals the number of distinct external symbols across `edit_plan`.

---

## Worked Example

Illustrative only.

Plan symbols: `strings.CutSuffix`, `time.ParseDuration`. `go.mod` says `go 1.22`.

```
$ go doc strings.CutSuffix
package strings // import "strings"

func CutSuffix(s, suffix string) (before string, found bool)
    CutSuffix returns s without the provided ending suffix string and reports
    whether it found the suffix. ...
$ go doc time.ParseDuration
package time // import "time"

func ParseDuration(s string) (Duration, error)
$ go doc time.ParseHours
doc: no symbol ParseHours in package time
exit status 1
```

`strings.CutSuffix` FOUND (added in Go 1.20, below 1.22); `time.ParseDuration` FOUND, two return values so the plan must handle the `error`; `time.ParseHours` NOT_FOUND.

---

## Exit Criteria

DONE when every external Go symbol has a status backed by a `go doc` declaration line from inside the module.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Module not in graph | **Return**: `NOT_IN_GRAPH`; `go get` is out of scope. |
| Phase 2 | `go doc` resolves a different version than `go.mod` | **Retry**: run it from the module directory (where `go.mod` is), not from `$HOME`. |
| Phase 2 | Package has build tags hiding the symbol | **Adjust**: run `GOFLAGS=-tags=<tag> go doc ...` with the tag the package uses. |
| Phase 2 | Symbol is newer than the `go` directive | **Return**: `VERSION_GATED`; do not raise the directive. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
