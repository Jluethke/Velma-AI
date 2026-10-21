# Go CLI Release for go install

**One-line description:** Makes a Go CLI installable with `go install module/path/cmd/tool@vX.Y.Z`: correct module path (including the `/vN` suffix for major 2+), immutable semver git tags, version reporting through `runtime/debug.ReadBuildInfo` (since `-ldflags -X` does not apply to `go install`), and a verification install through the module proxy into a temporary `GOBIN`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tool_name` (string, required): Executable name (the last element of the main package path).
- `release_version` (string, required): Semver with a `v` prefix for the tag, for example `v1.4.0`.
- `project_dir` (string, required): Root of the Go module.
- `e2e_run_log` (string, required): Passing log from `cli-go-testscript-e2e`.

---

## Outputs

- `package_artifact` (string[]): The module path with version, for example `github.com/acme/logtrim/cmd/logtrim@v1.4.0`, plus any binary archives built.
- `install_check_log` (string): Output of the proxy fetch and the clean `go install` run.

---

## Phase 1: Module Path and Version Reporting

### Entry Criteria
- `e2e_run_log` shows no `FAIL`.

### Actions
1. Check `go.mod`'s first line: `module github.com/acme/logtrim`. It must equal the repository URL path. If `release_version` is `v2.0.0` or higher, the module path must end in `/v2` (and imports inside the module must use it), per Go module major-version rules.
2. The main package lives at `cmd/logtrim/` (or the module root). Binary name = last path element, so `go install .../cmd/logtrim@v1.4.0` produces `logtrim`.
3. Report the version from build info, which `go install module@version` stamps:
```go
import "runtime/debug"

var version = "" // optional override via -ldflags "-X main.version=..." for GoReleaser builds

func Version() string {
    if version != "" { return version }
    if info, ok := debug.ReadBuildInfo(); ok && info.Main.Version != "" {
        return info.Main.Version   // "v1.4.0" from go install; "(devel)" or a VCS pseudo-version for local builds
    }
    return "unknown"
}
```
   Pass `Version()` to cobra's `Version` field.
4. Run `go mod tidy` and confirm `git status` shows no changes to `go.mod`/`go.sum` afterwards (commit them if it does).

### Output
Module ready for tagging.

### Quality Gate
- `head -1 go.mod` matches the repository path (with `/vN` when major is 2 or more).
- `go build ./... && go vet ./...` prints nothing.

---

## Phase 2: Tag and Fetch Through the Proxy

### Entry Criteria
- Phase 1 committed and pushed to the default branch.

### Actions
1. Tag the exact commit that passed CI: `git tag v1.4.0 && git push origin v1.4.0`. With the user's approval only; tags are public promises.
2. Never move or delete a pushed tag. The module proxy and checksum database cache the first content they see; a moved tag produces `verifying module: checksum mismatch` for users. To withdraw a version, publish a new one with a `retract` directive in `go.mod` (for example `retract v1.4.0 // broken flag parsing`).
3. Ask the proxy to fetch the version: `GOPROXY=https://proxy.golang.org GOFLAGS=-mod=mod go list -m github.com/acme/logtrim@v1.4.0`. It prints `github.com/acme/logtrim v1.4.0` when available.

### Output
Tagged version visible on the proxy.

### Quality Gate
- `go list -m` prints the module and `release_version`.

---

## Phase 3: Clean Install and Optional Binaries

### Entry Criteria
- Proxy lists the version.

### Actions
1. Install into a temporary `GOBIN` from outside the module, so the local `go.mod` is not used:
```
cd "$(mktemp -d)"
GOBIN="$PWD/bin" go install github.com/acme/logtrim/cmd/logtrim@v1.4.0
./bin/logtrim --version; echo "exit=$?"
```
   Expect `logtrim version v1.4.0`.
2. `go install pkg@version` ignores `replace` and `exclude` directives in the module's `go.mod` and fails if the main module's `go.mod` contains them in a way that changes the build; remove them before tagging if the install errors mention them.
3. Optional prebuilt binaries for users without Go: GoReleaser. Check config with `goreleaser check`, test locally with `goreleaser release --snapshot --clean`, and inspect `dist/`. Its default ldflags set `main.version`, which the `Version()` override above uses.
4. Save all outputs as `install_check_log`.

### Output
`package_artifact`, `install_check_log`.

### Quality Gate
- The clean install prints the tag version and `exit=0`.
- If GoReleaser is used, `goreleaser check` reports no errors.

---

## Do Not

- Do not rely on `-ldflags "-X main.version=..."` for `go install` users; that flag is only applied when you control the build command.
- Do not tag before CI is green on that commit.
- Do not run the verification install from inside the module directory.

---

## Worked Example

Illustrative.
```
$ git tag v1.4.0 && git push origin v1.4.0
$ GOPROXY=https://proxy.golang.org go list -m github.com/acme/logtrim@v1.4.0
github.com/acme/logtrim v1.4.0
$ cd "$(mktemp -d)" && GOBIN="$PWD/bin" go install github.com/acme/logtrim/cmd/logtrim@v1.4.0
go: downloading github.com/acme/logtrim v1.4.0
$ ./bin/logtrim --version; echo "exit=$?"
logtrim version v1.4.0
exit=0
```

---

## Exit Criteria

DONE when the tagged version is on the module proxy, `go install module/cmd/tool@version` works from a clean directory, and the binary reports the tag as its version.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `e2e_run_log` has `FAIL` | **Stop**: return to `cli-go-testscript-e2e`. |
| Phase 1 | Major version 2+ without `/v2` in the module path | **Adjust**: update `module` and every internal import; retest. |
| Phase 2 | Proxy says `unknown revision` | **Retry**: confirm the tag is pushed (`git ls-remote --tags origin`), then fetch again. |
| Phase 3 | `--version` prints `(devel)` | **Adjust**: the binary came from a local build, not `go install @version`; rerun Phase 3 step 1 exactly. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
