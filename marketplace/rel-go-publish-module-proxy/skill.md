# Go Module Publish through the Module Proxy

**One-line description:** Publishes a Go module version the only way Go supports (a pushed semver tag), makes `proxy.golang.org` and `sum.golang.org` record it immediately with `go list -m`, reads the proxy `.info` endpoint to confirm, and uploads binaries plus `SHA256SUMS` to a GitHub release that refuses to create a missing tag.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the module root.
- `release_tag` (object, required): From rel-tag-sign-git; tag name (for example `v1.9.0` or `sub/dir/v1.9.0`) and commit.
- `go_dist` (object, required): From rel-go-reproducible-build; binaries and `SHA256SUMS`. May be empty for library-only modules.
- `provenance_verification` (object, required): From rel-slsa-provenance-attest; must have `verified` = true when `go_dist` has binaries.

---

## Outputs

- `go_module_version_check` (object): `module_path`, `version`, proxy `.info` JSON (`Version`, `Time`), the `go list -m` output, and the GitHub release URL when binaries were uploaded.

---

## Phase 1: Preflight

### Entry Criteria
- The tag is pushed: `git ls-remote --tags origin <tag>` prints it.

### Actions
1. Module path: `go list -m` in `repo_path`.
2. Check the tag form against the module location:

   | Module location | Tag form |
   |---|---|
   | repository root | `vX.Y.Z` |
   | subdirectory `sub/dir` | `sub/dir/vX.Y.Z` |
   | major version 2+ | module path ends `/vN` and tag major is N |

3. Check the module is public. If the path matches `go env GOPRIVATE` or `GONOPROXY`, the public proxy will not serve it and Phase 2 does not apply; record "private module" and skip to Phase 3.
4. Confirm the version is not already known to the proxy: `curl -s -o /dev/null -w '%{http_code}\n' https://proxy.golang.org/<escaped module path>/@v/<version>.info`. Escape uppercase letters as `!` plus lowercase (`github.com/Azure/x` becomes `github.com/!azure/x`), per the module proxy protocol.

### Output
Preflight record.

### Quality Gate
- Tag form matches the table row for the module location.
- The proxy `.info` status before publishing is recorded (`404` or `410` expected for a new version).

---

## Phase 2: Make the Proxy and Checksum Database Record It

### Entry Criteria
- Public module, tag pushed.

### Actions
1. Request the version through the proxy from any machine: `GOPROXY=https://proxy.golang.org GO111MODULE=on go list -m <module path>@<version>`. Run it outside the module directory (for example in `/tmp`) so the local module does not satisfy the request.
2. Expected output: `<module path> <version>`. This fetch makes the proxy cache the zip and the checksum database record the `h1:` hash. From now on the tag is permanent: moving it causes `verifying module: checksum mismatch` with a `SECURITY ERROR` for every user.
3. Read the record: `curl -s https://proxy.golang.org/<escaped path>/@v/<version>.info` returns `{"Version":"v1.9.0","Time":"..."}`.
4. Optionally read the checksum database line: `curl -s https://sum.golang.org/lookup/<module path>@<version>` prints the `h1:` hashes for the module zip and `go.mod`.
5. pkg.go.dev picks the version up from the proxy; it can take a while to appear. The proxy fetch above is the request mechanism; do not rely on a manual web form.

### Output
Proxy and sumdb records.

### Quality Gate
- `go list -m` printed the module path and version.
- The `.info` endpoint returns HTTP 200 with `Version` equal to the tag version.

---

## Phase 3: Upload Binaries to a GitHub Release

### Entry Criteria
- `go_dist` has binaries, and `provenance_verification.verified` = true. Skip this phase for library-only modules.

### Actions
1. Create the release from the existing tag only: `gh release create <tag> <go_dist files> SHA256SUMS --verify-tag --notes-file RELEASE_NOTES.md`. `--verify-tag` aborts if the tag does not exist on the remote instead of creating one from the default branch.
2. With GoReleaser instead: `goreleaser release --clean` with `GITHUB_TOKEN` set, running on the tag. It uploads archives and `checksums.txt`; do not also run `gh release create`.
3. For a pre-release tag add `--prerelease` to `gh release create` (GoReleaser sets it automatically with `release.prerelease: auto`).
4. Confirm assets: `gh release view <tag> --json assets --jq '.assets[].name'`.
5. Download one asset and check it: `gh release download <tag> -p '<name>_linux_amd64*' -p SHA256SUMS -D /tmp/chk && cd /tmp/chk && sha256sum -c --ignore-missing SHA256SUMS`.

### Output
`go_module_version_check`.

### Quality Gate
- `sha256sum -c --ignore-missing` prints `OK` for the downloaded asset.
- Every file from `go_dist` appears in the release asset list.

---

## Worked Example

Illustrative. Module `example.com/acme/tool/v2`, tag `v2.1.0`. (Had `go.mod` said `example.com/acme/tool` without `/v2`, Phase 1 would have stopped.)

- Phase 1: `go list -m` prints `example.com/acme/tool/v2`. `.info` returns `404` before publishing.
- Phase 2: in `/tmp`, `GOPROXY=https://proxy.golang.org go list -m example.com/acme/tool/v2@v2.1.0` prints `example.com/acme/tool/v2 v2.1.0`. `.info` now returns `{"Version":"v2.1.0","Time":"2026-10-20T14:02:11Z"}`.
- Phase 3: `gh release create v2.1.0 dist/* SHA256SUMS --verify-tag --notes-file RELEASE_NOTES.md`; `sha256sum -c --ignore-missing SHA256SUMS` prints `tool_linux_amd64: OK`.

---

## Exit Criteria

DONE when the proxy `.info` endpoint serves the version, `go list -m` resolves it through the public proxy, and (for modules with binaries) the GitHub release holds every binary and a `SHA256SUMS` that checks out.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Major 2+ tag but module path lacks `/vN` | **Stop**: return to rel-go-api-break-gorelease; do not publish. |
| Phase 2 | `go list` returns `invalid version: unknown revision` | **Retry**: the tag was not pushed or is in another repo path; check `git ls-remote --tags origin`. |
| Phase 2 | Proxy serves a different commit than expected | **Stop**: the tag moved after a fetch; publish a new patch version and `retract` the bad one (rel-yank-bad-release). |
| Phase 3 | `gh release create` says tag not found | **Adjust**: push the tag first; never drop `--verify-tag`. |
| Phase 3 | Checksum mismatch on download | **Stop**: assets were rebuilt; delete the release assets (not the tag) and upload the reproducible build. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
