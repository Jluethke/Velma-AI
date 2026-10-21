# Go Semantic Import Versioning

**One-line description:** Applies Go semantic import versioning: decides whether the release needs a `/vN` module path suffix, rewrites `go.mod` and every import inside the module, and proves the module builds, vets and tests under the new path.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `go_change_class` (string, required): From `pkg-go-gorelease-diff`.
- `release_version` (string, required): From `pkg-release-version-lock`, for example `v2.0.0`.
- `project_dir` (string, required): Module root.

---

## Outputs

- `go_module_plan` (object): Old and new module path, strategy (`none`, `major-branch`, `major-subdirectory`), files changed, and pasted build, vet and test output.

---

## Phase 1: Decide Whether the Path Changes

### Entry Criteria
- `go.mod` exists; `go list -m` prints the current path.

### Actions
1. Read the major number N of `release_version`.
2. Apply the table:

   | Release major | Current path suffix | Action |
   |---|---|---|
   | v0 or v1 | none | no path change; skip to Phase 3 |
   | v2 or more | already `/vN` with the same N | no path change; skip to Phase 3 |
   | v2 or more | `/v(N-1)` or none | change the path to end in `/vN` |

3. Know why: Go treats `example.com/m` and `example.com/m/v2` as different modules so both can live in one build. A v2+ tag on a module whose path lacks `/v2` is only usable as `v2.0.0+incompatible`, and only if the module has no `go.mod` at all; with a `go.mod`, the go command rejects it.
4. Choose a strategy:

   | Strategy | How | When |
   |---|---|---|
   | major-branch (recommended by the Go blog "Go Modules: v2 and Beyond") | change `go.mod` on the main branch; keep a `v1` branch for v1 fixes | most projects |
   | major-subdirectory | copy the code into `v2/` with its own `go.mod` | must support GOPATH-mode users |

### Output
Decision and strategy.

### Quality Gate
- The table row is recorded with the current `go list -m` output.

---

## Phase 2: Rewrite the Module Path

### Entry Criteria
- Path change required.

### Actions
1. For major-branch, first create the maintenance branch from the last v1 commit: `git branch v1 <last v1 tag>` and push it.
2. Edit go.mod: `go mod edit -module example.com/m/v2`.
3. Rewrite imports of the module's own packages, every `.go` file including tests: `grep -rl '"example.com/m' --include=*.go . | xargs sed -i -E 's#"example.com/m(/|")#"example.com/m/v2\1#g'` (GNU sed; on macOS use `sed -i '' -E`). Check that no path became `/v2/v2`: `grep -rn 'example.com/m/v2/v2' --include=*.go .` prints nothing.
4. Update README and doc examples: `go get example.com/m/v2` and `import "example.com/m/v2"`.
5. Run `go mod tidy`.

### Output
Module renamed.

### Quality Gate
- `go list -m` prints the `/vN` path.
- `grep -rn '"example.com/m/' --include=*.go . | grep -v '/v2'` prints nothing (no import left on the old path).

---

## Phase 3: Build, Vet, Test

### Entry Criteria
- Phase 2 done, or no path change needed.

### Actions
1. Run `go build ./... && go vet ./... && go test ./...`.
2. Run `go mod verify`; it prints `all modules verified`.
3. If the module depends on its own older major (for example a v2 that wraps v1 types), confirm `go.mod` lists `example.com/m vX` as a requirement on purpose.
4. Commit in one commit titled for the major version change. Do not tag here; tagging is in `pkg-go-tag-and-proxy`.

### Output
`go_module_plan`.

### Quality Gate
- `go build`, `go vet` and `go test` exit 0.
- `go mod verify` prints `all modules verified`.

---

## Worked Example

Illustrative. `github.com/acme/ratelimit`, `go_change_class = major`, `release_version = v2.0.0`.

Phase 1: current path has no suffix, release major 2: change to `/v2`, major-branch strategy. `git branch v1 v1.4.2 && git push origin v1`.

Phase 2:
```
$ go mod edit -module github.com/acme/ratelimit/v2
$ grep -rl '"github.com/acme/ratelimit' --include=*.go . | xargs sed -i -E 's#"github.com/acme/ratelimit(/|")#"github.com/acme/ratelimit/v2\1#g'
$ go list -m
github.com/acme/ratelimit/v2
```

Phase 3:
```
$ go build ./... && go vet ./... && go test ./...
ok  github.com/acme/ratelimit/v2        0.39s
ok  github.com/acme/ratelimit/v2/clock  0.11s
$ go mod verify
all modules verified
```

---

## Exit Criteria

DONE when the module path suffix matches the release major per Go rules, no import uses the old path, and build, vet, test and verify pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Class is major but release major is 0 | **Adjust**: no path change; v0 has no compatibility promise. |
| Phase 2 | `/v2/v2` paths after sed | **Retry**: `git checkout -- .` and rerun with the corrected pattern. |
| Phase 3 | Import cycle or missing package after rename | **Adjust**: a path was missed; search for the old path in non-Go files such as `//go:generate` lines and embed patterns. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
