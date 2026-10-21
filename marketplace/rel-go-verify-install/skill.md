# Go Post-Publish Install Verification

**One-line description:** Fetches the just-published module version through the public proxy into a fresh throwaway module with checksum database verification on, builds a program that imports it, installs any command with `go install pkg@version`, and reads `go version -m` to prove the binary was built from that exact module version and hash.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `go_module_version_check` (object, required): From rel-go-publish-module-proxy; gives `module_path` and `version`.
- `release_tag` (object, required): Tag name; used to match the version.

---

## Outputs

- `go_install_report` (object): `status` (`PASS` or `FAIL`), `go get` output, `go.sum` lines, build result, `go install` result, `go version -m` output, and the environment checks.

---

## Phase 1: Clean Environment

### Entry Criteria
- `go_module_version_check.version` equals the version part of `release_tag`.

### Actions
1. Fresh module cache so nothing local satisfies the fetch: `export GOMODCACHE=$(mktemp -d)` and `export GOFLAGS=-modcacherw` (lets you delete it later).
2. Public proxy and checksum database must be active:
   - `go env GOPROXY` must start with `https://proxy.golang.org` (or the organization's proxy that forwards to it).
   - `go env GOSUMDB` must be `sum.golang.org` and must not be `off`.
   - `go env GONOSUMDB GOPRIVATE GOINSECURE` must not match the module path.
   Set them per command if needed: `GOPROXY=https://proxy.golang.org,direct GOSUMDB=sum.golang.org`.
3. Empty directory outside any module: `D=$(mktemp -d) && cd "$D" && go mod init example.com/verify`.

### Output
Clean environment.

### Quality Gate
- `go env GOSUMDB` prints `sum.golang.org`.
- `go env GOMOD` in `$D` prints `$D/go.mod` (not the repository's go.mod).

---

## Phase 2: Fetch and Build

### Entry Criteria
- Environment clean.

### Actions
1. `go get <module_path>@<version>`. Expected line: `go: added <module_path> <version>`. The go command checks the downloaded zip against `sum.golang.org`; a mismatch prints `SECURITY ERROR`.
2. Read `go.sum`: two lines for the module, one `h1:` for the zip and one for `/go.mod`. Compare the zip hash with `curl -s https://sum.golang.org/lookup/<module_path>@<version>`.
3. Write `main.go` importing one public package of the module and calling one exported function or referencing one exported identifier (use `go doc <module_path>` to pick a real one; do not invent a function name).
4. `go build ./...` and `go vet ./...` must exit 0.

### Output
Build results.

### Quality Gate
- `go.sum` contains `<module_path> <version> h1:` and `<module_path> <version>/go.mod h1:` lines.
- `go build ./...` exits 0.

---

## Phase 3: Install Commands and Inspect

### Entry Criteria
- Phase 2 passed. Skip this phase if the module has no `main` packages.

### Actions
1. For each command package (for example `<module_path>/cmd/tool`): `GOBIN=$(mktemp -d) go install <module_path>/cmd/tool@<version>`.
2. Inspect: `go version -m $GOBIN/tool`. Check the `mod` line: `mod <module_path> <version> h1:...` with the same `h1:` hash as `go.sum`. A `(devel)` version means it was built from a local checkout, not from the published module.
3. Run `$GOBIN/tool --version` (or `-h`) and require exit 0; if the project stamps versions through `-ldflags -X`, note that `go install` does not apply release ldflags, so the printed version may differ from release binaries. Use `debug.ReadBuildInfo` output or the `mod` line as the source of truth.
4. Set `status` = `PASS` only if all checks passed.

### Output
`go_install_report`.

### Quality Gate
- The `mod` line in `go version -m` shows `<version>` and an `h1:` hash equal to `go.sum`.
- `status` agrees with recorded exit codes.

---

## Worked Example

Illustrative. `module_path` = `example.com/acme/tool/v2`, `version` = `v2.1.0`.

- Phase 1: `go env GOSUMDB` prints `sum.golang.org`; new `GOMODCACHE`.
- Phase 2: `go get example.com/acme/tool/v2@v2.1.0` prints `go: added example.com/acme/tool/v2 v2.1.0`. `go.sum` holds `example.com/acme/tool/v2 v2.1.0 h1:Xw3...=`. `main.go` uses `parse.New` (found with `go doc example.com/acme/tool/v2/parse`). Build passes.
- Phase 3: `go version -m $GOBIN/tool` shows `mod	example.com/acme/tool/v2	v2.1.0	h1:Xw3...=`. `status` = `PASS`.

---

## Exit Criteria

DONE when the version was fetched through the public proxy with checksum verification into a fresh module, a program using it builds, commands install from `@version`, and the binary's module line names the exact version and hash.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `GOSUMDB=off` or `GONOSUMDB` matches | **Adjust**: unset for this check; a private module cannot use the public sumdb, so record "private, sumdb not applicable". |
| Phase 2 | `SECURITY ERROR ... checksum mismatch` | **Stop**: the tag content changed after the first fetch; FAIL and go to rel-yank-bad-release (retract and new version). |
| Phase 2 | `module declares its path as X but was required as Y` | **Return**: FAIL; `go.mod` module path does not match the import path or `/vN` suffix. |
| Phase 3 | `go install` fails with `replace` directive error | **Return**: FAIL; `go install pkg@version` rejects modules whose main `go.mod` has `replace` or `exclude` directives. |
| Phase 3 | `go version -m` shows `(devel)` | **Retry**: you built a local checkout; use `go install ...@<version>`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
