# Go Tag, Proxy Fetch and Consumer Install

**One-line description:** Releases a Go module by pushing an annotated semver tag, fetching that version through `proxy.golang.org` so it is cached and indexed, installing it into a clean consumer module, and fixing mistakes with a `retract` directive instead of moving tags.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `go_module_plan` (object, required): From `pkg-go-module-major-path`; final module path and passing tests.
- `release_tag` (string, required): From `pkg-release-version-lock`, for example `v2.0.0` or `sub/v1.3.0`.
- `license_report` (object, required): From `pkg-license-metadata`; confirms a LICENSE file at the module root.

---

## Outputs

- `go_publish_record` (object): Tag and commit, proxy `.info` response, consumer build output, pkg.go.dev URL, and any retract entries added.

---

## Phase 1: Tag the Release Commit

### Entry Criteria
- `go_module_plan` gates passed on the commit to tag.
- `license_report.license_files` includes a file at the module root.
- The module is public. For private modules set `GOPRIVATE` and skip the proxy phase; the public proxy cannot fetch them.

### Actions
1. Confirm the tag format: Go requires `vMAJOR.MINOR.PATCH` (with optional `-pre`). For a module in subdirectory `sub/`, the tag is `sub/vX.Y.Z`.
2. Confirm HEAD is the intended commit and is pushed: `git status -sb` shows no ahead count.
3. Create and push: `git tag -a <release_tag> -m "<release_tag>"` then `git push origin <release_tag>`.
4. Never delete, move or re-push a tag that was already pushed. The proxy and the checksum database (`sum.golang.org`) record the first content they see; a moved tag produces `verifying module: checksum mismatch` and `SECURITY ERROR` for users.

### Output
Pushed tag.

### Quality Gate
- `git ls-remote --tags origin <release_tag>` prints the tag and its commit.

---

## Phase 2: Fetch Through the Proxy

### Entry Criteria
- Tag pushed.

### Actions
1. Request the version through the proxy, from any directory: `GOPROXY=https://proxy.golang.org GO111MODULE=on go list -m <module path>@<version>`. It prints `<module path> <version>`.
2. Read the proxy record: `curl -s https://proxy.golang.org/<module path lower-cased with ! escaping>/@v/<version>.info` returns JSON with `Version` and `Time`. Uppercase letters in paths are escaped as `!` plus the lowercase letter (`github.com/Acme` becomes `github.com/!acme`).
3. Request documentation: open `https://pkg.go.dev/<module path>@<version>`; if it says the version is not found, use its "Request" button. Documentation is hidden when no redistributable license is detected.

### Output
Proxy-cached version.

### Quality Gate
- `go list -m` prints the version.
- The `.info` JSON `Version` equals the tag version.

---

## Phase 3: Install Into a Clean Consumer

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. `mkdir /tmp/goconsumer && cd /tmp/goconsumer && go mod init example.com/consumer`.
2. `go get <module path>@<version>`.
3. Write `main.go` importing the module and calling one public function from the README.
4. `go build ./... && go vet ./...` and run the binary. Output must match the README example.
5. `go list -m all | grep <module path>` shows the exact version.

### Output
Consumer verified.

### Quality Gate
- `go build` exits 0 and the program output matches the README example.

---

## Phase 4: Fix Forward With retract

### Entry Criteria
- Only if a released version is broken; otherwise record "not needed".

### Actions
1. Do not move the tag. Add to `go.mod` on the main branch:
   ```
   retract v2.0.0 // Panics on nil clock; use v2.0.1.
   ```
2. Fix the bug, then tag the next patch (`v2.0.1`) which carries the retract directive, and run Phases 1 to 3 for it.
3. Users then see the retraction in `go list -m -u all` and `go get` skips retracted versions when resolving `@latest`. Retract requires Go 1.16 or later.

### Output
`go_publish_record`.

### Quality Gate
- `go list -m -retracted -versions <module path>` shows the retracted version (when used).

---

## Worked Example

Illustrative. `github.com/acme/ratelimit/v2`, tag `v2.0.0`.

Phase 2:
```
$ GOPROXY=https://proxy.golang.org go list -m github.com/acme/ratelimit/v2@v2.0.0
github.com/acme/ratelimit/v2 v2.0.0
$ curl -s https://proxy.golang.org/github.com/acme/ratelimit/v2/@v/v2.0.0.info
{"Version":"v2.0.0","Time":"2026-10-20T15:02:11Z"}
```
Phase 3:
```
$ go get github.com/acme/ratelimit/v2@v2.0.0
go: added github.com/acme/ratelimit/v2 v2.0.0
$ go build ./... && ./consumer
allowed: true
```

---

## Exit Criteria

DONE when the tag is pushed and immutable, the proxy serves the version, a clean consumer builds against it, and any broken release is retracted by a newer patch.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tag points at the wrong commit, not yet pushed | **Adjust**: `git tag -d <tag>` locally and re-create; allowed only before push. |
| Phase 1 | Wrong tag already pushed | **Stop**: never move it; retract it in Phase 4 and release the next patch. |
| Phase 2 | `unknown revision` from the proxy | **Retry**: confirm the tag is on the remote, then rerun once; the proxy fetches on demand. |
| Phase 2 | pkg.go.dev shows no documentation | **Adjust**: the license is not recognized; check `license_report` and the LICENSE file text. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
