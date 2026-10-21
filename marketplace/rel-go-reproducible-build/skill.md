# Go Reproducible Release Binaries

**One-line description:** Cross-compiles Go release binaries from the release tag with a pinned toolchain, `CGO_ENABLED=0`, `-trimpath` and version stamping through `-ldflags -X`, builds each target twice in different directories, proves the SHA-256 values match, and writes a `SHA256SUMS` file; includes the GoReleaser settings that keep archives reproducible.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the module root.
- `release_tag` (object, required): Tag name and commit SHA.
- `target_platforms` (string[], optional): `GOOS/GOARCH` pairs, for example `["linux/amd64", "linux/arm64", "darwin/arm64", "windows/amd64"]`. Defaults to the list in `.goreleaser.yaml` if present, otherwise ask the user.

---

## Outputs

- `go_dist` (object): Binary or archive paths per platform from build A, their SHA-256 values, the `SHA256SUMS` file path, and the main package path.
- `go_repro_report` (object): Hashes of A and B per platform, `identical` per platform, Go toolchain version, environment, and any cause found.

---

## Phase 1: Pin the Toolchain and Flags

### Entry Criteria
- `release_tag` checked out cleanly: `git status --porcelain` empty.

### Actions
1. Read `go.mod` for `go` and `toolchain` lines. Use exactly that toolchain; with Go 1.21 or later, `GOTOOLCHAIN=go1.X.Y go version` downloads and runs it. Record `go version`.
2. Find the main package: `go list -f '{{if eq .Name "main"}}{{.ImportPath}}{{end}}' ./...`.
3. Fix the flag set (same for every build):
   - `CGO_ENABLED=0` unless the program needs cgo. With cgo, the C toolchain and libc enter the build; record that reproducibility then depends on the same C compiler.
   - `-trimpath` removes local file system paths from the binary.
   - `-ldflags "-s -w -X main.version=<tag>"`. Use the tag, not `$(date)`; any time value must come from `git log -1 --format=%cI <tag>`.
   - Leave `-buildvcs` at its default; it embeds `vcs.revision`, `vcs.time` and `vcs.modified`, which are fixed for a clean tag checkout.

### Output
Toolchain and flag record.

### Quality Gate
- `go version` output equals the `toolchain` line (or the `go` line when there is no `toolchain` line).
- The `-ldflags` value contains no shell command substitution of `date`.

---

## Phase 2: Build Twice

### Entry Criteria
- Phase 1 done.

### Actions
1. Two checkouts at different paths: `git worktree add /tmp/go-a <tag>` and `git worktree add /tmp/go-b-other-path <tag>`. Different paths catch path leaks that `-trimpath` should remove.
2. In each, for every platform: `CGO_ENABLED=0 GOOS=<os> GOARCH=<arch> go build -trimpath -ldflags "-s -w -X main.version=<tag>" -o /tmp/out-a/<name>_<os>_<arch><.exe on windows> <main package>`.
3. Hash: `cd /tmp/out-a && sha256sum * > /tmp/SHA256SUMS.a`, same for b.
4. Inspect one binary: `go version -m /tmp/out-a/<name>_linux_amd64`. Check the lines `build -trimpath=true`, `build CGO_ENABLED=0`, `build vcs.revision=<tag commit>`, `build vcs.modified=false`.
5. GoReleaser users: confirm `.goreleaser.yaml` has `builds[].flags: [-trimpath]`, `builds[].mod_timestamp: "{{ .CommitTimestamp }}"`, `builds[].ldflags` without dates, and archive file `info.mtime: "{{ .CommitDate }}"`. Run `goreleaser check`, then `goreleaser release --snapshot --clean` twice and compare `dist/checksums.txt`.

### Output
Two binary sets and checksum files.

### Quality Gate
- `go version -m` shows `vcs.modified=false` and `-trimpath=true`.
- One binary exists per platform in both output folders.

---

## Phase 3: Compare

### Entry Criteria
- Both builds done.

### Actions
1. `diff /tmp/SHA256SUMS.a /tmp/SHA256SUMS.b`. No output means identical.
2. If a binary differs: `go version -m` on both and diff the outputs; then `cmp -l a b | head` to see offsets. Common causes:

   | Evidence | Cause |
   |---|---|
   | different `go` line in `go version -m` | different toolchains |
   | `vcs.modified=true` in one | dirty tree (generated file not committed) |
   | different `-ldflags` value | a date or env value in ldflags |
   | path strings in `strings <binary> \| grep /tmp/go-` | `-trimpath` missing or cgo debug info |

3. Write the final `SHA256SUMS` from build A (it is what gets signed and published).

### Output
`go_dist`, `go_repro_report`.

### Quality Gate
- `diff` of the two checksum files prints nothing, or each differing binary has a cause from the table backed by command output.
- `sha256sum -c SHA256SUMS` in `/tmp/out-a` prints `OK` for every file.

---

## Worked Example

Illustrative. Tag `v2.1.0`, `toolchain go1.23.4`, platforms `linux/amd64`, `darwin/arm64`.

- Phase 1: `go version` prints `go version go1.23.4 linux/amd64`. Main package `example.com/acme/tool/cmd/tool`.
- Phase 2: `go version -m /tmp/out-a/tool_linux_amd64` includes:
  ```
  build	-trimpath=true
  build	CGO_ENABLED=0
  build	vcs.revision=9d2c6b0e...
  build	vcs.modified=false
  ```
- Phase 3: `diff /tmp/SHA256SUMS.a /tmp/SHA256SUMS.b` prints nothing. `go_dist.SHA256SUMS` = `/tmp/out-a/SHA256SUMS`.

---

## Exit Criteria

DONE when every target binary was built twice in different paths with the pinned toolchain and recorded flags, checksums match or each mismatch has a measured cause, and a `SHA256SUMS` file covers build A.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `GOTOOLCHAIN` download blocked | **Adjust**: install that Go version from go.dev/dl and put it first on `PATH`. |
| Phase 2 | Build needs cgo for a target | **Adjust**: build that target on a native runner with the C toolchain recorded; mark its reproducibility as conditional. |
| Phase 2 | `vcs.modified=true` | **Stop**: the worktree has changes; `git status` in it, find the generated file, commit it in a new release. |
| Phase 3 | Hashes differ | **Return**: record cause; do not publish until a rerun with the fix matches. |
| Any | Tempted to set `-buildvcs=false` to hide `vcs.modified` | **Stop**: that hides a dirty build. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
