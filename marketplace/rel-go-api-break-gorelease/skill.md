# Go Module API Break Detection with gorelease

**One-line description:** Runs `gorelease` against the last tag to list incompatible and compatible API changes in a Go module, reads its suggested version, and enforces the Go rule that a major version 2 or higher needs a `/vN` module path suffix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the module root (directory containing `go.mod`). For a multi-module repo, run once per module.
- `last_tag` (string, optional): Previous version tag of this module (`v1.4.2`, or `sub/dir/v1.4.2` for a module in a subdirectory). Defaults to the newest matching tag.

---

## Outputs

- `go_api_breaks` (object): `incompatible` (list of gorelease lines), `compatible` (list), `suggested_version` (from gorelease), `module_path`, `module_path_ok` (bool), and `notes` (go directive changes, retractions).

---

## Phase 1: Prepare

### Entry Criteria
- `go.mod` exists in `repo_path`. Working tree is clean (`git status --porcelain` empty).

### Actions
1. Read the module path: `go list -m` (prints for example `example.com/acme/parser`).
2. Install gorelease: `go install golang.org/x/exp/cmd/gorelease@latest`. Confirm `gorelease -h` prints usage. gorelease lives in `x/exp`, which carries no compatibility promise; check `gorelease -h` for the flags your build accepts.
3. If `last_tag` is empty: for a root module `git describe --tags --abbrev=0 --match 'v[0-9]*'`; for a module in `sub/dir`, `git describe --tags --abbrev=0 --match 'sub/dir/v[0-9]*'`. gorelease takes the version without the directory prefix as `-base`.

### Output
Module path, base version, working gorelease.

### Quality Gate
- `go list -m` output recorded as `module_path`.
- `go build ./... && go vet ./...` exit 0 at HEAD (gorelease reports build errors as problems; fix those first in a separate change).

---

## Phase 2: Run gorelease

### Entry Criteria
- Phase 1 gates pass.

### Actions
1. Run from the module root: `gorelease -base=<base version>`. It downloads the base version (through the module proxy unless `GOPROXY`/`GOPRIVATE` say otherwise) and compares it with the working tree.
2. Read the output sections:
   - `# <package>` headers, then `## incompatible changes` lines such as `Parse: changed from func(string) (*Doc, error) to func(string, ...Option) (*Doc, error)`.
   - `## compatible changes` lines such as `ParseFile: added`.
   - A final line such as `Suggested version: v1.5.0` (or `v2.0.0` when there are incompatible changes), or `Inferred base version: ...` when you omitted `-base`.
3. Copy each incompatible line into `incompatible` and each compatible line into `compatible`. Do not rephrase.
4. Note Go-specific traps gorelease reports as incompatible that people often doubt:
   - Adding a method to an exported interface breaks every external implementer.
   - Adding a field to a struct breaks unkeyed composite literals (`T{a, b}`) in other packages; the Go 1 compatibility document allows this, so record it and flag it as a policy question rather than an automatic major bump.
   - Changing a function to a variadic signature breaks code that assigns it to a function-typed variable.
5. Optionally validate a proposed version: `gorelease -base=<base> -version=<proposed>`; it prints an error if the proposed version is too small.

### Output
`incompatible`, `compatible`, `suggested_version`.

### Quality Gate
- The exact command and full output are saved.
- `suggested_version` is copied verbatim from the output.

---

## Phase 3: Module Path Rule

### Entry Criteria
- Phase 2 done.

### Actions
1. If there are incompatible changes and the current major is 1 or higher, the next version is a new major. Go requires the module path to end in `/vN` for N >= 2 (Go Modules Reference, "Major version suffixes"):
   - `go.mod` must say `module example.com/acme/parser/v2`.
   - Every internal import of the module's own packages must change to the `/v2` path.
   - Set `module_path_ok` = false until both are true. This flow reports; the change itself is a separate commit.
2. If the current major is 0, incompatible changes may ship in a MINOR bump (v0 has no compatibility promise); record that.
3. Record `go` directive changes from `git diff <last_tag> HEAD -- go.mod` (a raised `go 1.N` line forces consumers to that toolchain) in `notes` as a policy question.
4. Record any `retract` directives added since the tag in `notes`.

### Output
Final `go_api_breaks`.

### Quality Gate
- If `suggested_version` major >= 2, `go list -m` ends in `/v<major>` or `module_path_ok` is false with the reason.
- `notes` includes the `go` directive values at the tag and at HEAD.

---

## Worked Example

Illustrative. Module `example.com/acme/parser`, `last_tag` = `v1.4.2`.

- Phase 1: `go list -m` prints `example.com/acme/parser`.
- Phase 2: `gorelease -base=v1.4.2` prints:
  ```
  # example.com/acme/parser
  ## incompatible changes
  Parse: changed from func(string) (*Doc, error) to func(context.Context, string) (*Doc, error)
  ## compatible changes
  ParseFile: added

  Suggested version: v2.0.0
  ```
- Phase 3: `go.mod` still says `module example.com/acme/parser`, so `module_path_ok` = false: releasing as `v2.0.0` without `/v2` makes the go command treat it as `v2.0.0+incompatible` or reject it. The alternative is to keep `Parse` and add `ParseContext` for a v1.5.0.

---

## Exit Criteria

DONE when `go_api_breaks` contains gorelease's incompatible and compatible lines verbatim, its suggested version, and a module path verdict consistent with that version.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `go install` fails behind a proxy | **Adjust**: set `GOPROXY` to the organization's proxy; do not set `GOFLAGS=-insecure`. |
| Phase 2 | Base version cannot be downloaded (private module) | **Adjust**: set `GOPRIVATE=example.com/acme/*` so the go command fetches directly with git credentials. |
| Phase 2 | gorelease reports errors about the working tree (build or `go.sum`) | **Stop**: fix with `go mod tidy` in a separate commit, then rerun. |
| Phase 3 | User wants v2 without `/v2` path | **Stop**: explain the Go module path rule; offer an additive v1 change instead. |
| Any | gorelease unavailable for the installed Go | **Adjust**: use `golang.org/x/exp/cmd/apidiff` per its `-h` usage and record the tool used. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
