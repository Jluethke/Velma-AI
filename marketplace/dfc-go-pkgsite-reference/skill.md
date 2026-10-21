# Go API Reference With go doc, Local pkgsite and pkg.go.dev

**One-line description:** Verifies a Go module's API reference the way users will see it, first with `go doc -all` in the terminal, then rendered locally by `pkgsite` before tagging, and finally on pkg.go.dev after a tagged release is fetched through the module proxy, including the license check that decides whether pkg.go.dev shows documentation at all.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the module root (contains `go.mod`).
- `docstring_report` (object[], required): Result of `dfc-go-doc-comments`; must show zero remaining findings.

---

## Outputs

- `api_reference_dir` (string): Where the reference lives: the pkg.go.dev URL `https://pkg.go.dev/<module>` and the local preview command.
- `api_build_log` (object[]): Findings from each view (terminal, local pkgsite, pkg.go.dev): problem, package, fix.

---

## Phase 1: Read the Reference in the Terminal

### Entry Criteria
- `docstring_report` shows zero remaining findings.
- `go build ./...` succeeds.

### Actions
1. List importable packages: `go list ./... | grep -v /internal/`.
2. For each, print the full reference: `go doc -all <import/path> | less`. Check that the package comment comes first and each exported identifier has text.
3. Check example functions are attached: `go doc -all` does not show examples; list them with `grep -rn -E '^func Example' --include='*_test.go' .` and confirm each name matches an identifier (`ExampleLimiter_Wait` attaches to method `Limiter.Wait`).
4. Run `go vet ./...`; its `tests` analyzer reports malformed example names such as an `Example` suffix that refers to an unknown identifier.

### Output
Terminal findings recorded in `api_build_log`.

### Quality Gate
- `go vet ./...; echo $?` prints `0` last.
- Every package from step 1 printed a package comment as the first paragraph of `go doc` output.

---

## Phase 2: Preview With Local pkgsite

### Entry Criteria
- Terminal review clean.

### Actions
1. Install: `go install golang.org/x/pkgsite/cmd/pkgsite@latest`.
2. From the module root, run `pkgsite .` (serves on `localhost:8080` by default; run `pkgsite -h` to confirm the flags in your version, including `-http` for the address and `-open` to launch a browser).
3. Open `http://localhost:8080/<module path>` and check, per package:

   | Check | Pass when |
   |---|---|
   | Overview | Package comment renders with headings and links (Go 1.19+ syntax) |
   | Index | Every exported identifier is listed |
   | Examples | Each `Example` function appears under its identifier |
   | Deprecated items | Items with a `Deprecated:` paragraph are collapsed and marked deprecated |
   | Doc links | `[Name]` links resolve (rendered as links, not literal brackets) |

4. Fix problems in the Go source comments only, then restart `pkgsite .` to see the change.

### Output
Local preview findings recorded.

### Quality Gate
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/<module path>` prints `200` while pkgsite runs.

---

## Phase 3: Confirm pkg.go.dev After a Release

### Entry Criteria
- A semver tag exists and is pushed (`git ls-remote --tags origin | grep v<x.y.z>` prints it). If no release is planned, stop after Phase 2 and record that pkg.go.dev was not checked.

### Actions
1. Check the license first. pkg.go.dev shows documentation only when it detects an accepted license file at the module root. Confirm `LICENSE` (or `LICENSE.md`, `COPYING`) exists at the root and contains an unmodified standard license text.
2. Ask the module proxy to fetch the version, which makes pkg.go.dev aware of it: `GOPROXY=https://proxy.golang.org go list -m <module>@v<x.y.z>`.
3. Open `https://pkg.go.dev/<module>@v<x.y.z>` after the proxy fetch. Indexing is not instant; if the page shows "not found", use the page's "Request" button, then check again later. Do NOT re-tag the release to force indexing; tags in the proxy are immutable.
4. Repeat the Phase 2 checklist on pkg.go.dev. If the page says documentation is not displayed due to license restrictions, the license was not recognized; fix the file in the next release.

### Output
`api_reference_dir` with the live URL.

### Quality Gate
- `curl -s -o /dev/null -w '%{http_code}' https://pkg.go.dev/<module>@v<x.y.z>` prints `200`.
- The page shows the Index section (not the license restriction notice).

---

## Worked Example

Illustrative only. Module `github.com/acme/ratelimit`.

Phase 1:
```
$ go vet ./...
ratelimit/example_test.go:14:1: ExampleLimiter_Wiat refers to unknown field or method: Limiter.Wiat
```
Rename to `ExampleLimiter_Wait`; `go vet ./...` exits 0.

Phase 2:
```
$ pkgsite .
... Listening on addr http://localhost:8080
```
The Overview shows `[RFC 6585]` as literal text: the link definition line was missing its colon. Fixed in `doc.go`.

Phase 3:
```
$ GOPROXY=https://proxy.golang.org go list -m github.com/acme/ratelimit@v1.3.0
github.com/acme/ratelimit v1.3.0
```
`https://pkg.go.dev/github.com/acme/ratelimit@v1.3.0` returns 200 and shows the Index and two examples.

---

## Exit Criteria

DONE when `go vet` passes, the local pkgsite render passes the checklist for every non-internal package, and, for a released version, pkg.go.dev shows the documentation with a recognized license.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `docstring_report` has open findings | **Return**: finish `dfc-go-doc-comments` first. |
| Phase 2 | `pkgsite` fails to install with the current Go version | **Adjust**: pkgsite tracks recent Go releases; install with the newest Go toolchain (`GOTOOLCHAIN=go<version> go install ...`). |
| Phase 3 | Module is private | **Stop**: pkg.go.dev serves only public modules; keep the local pkgsite preview as the reference and record it in `api_reference_dir`. |
| Phase 3 | Page still missing after the proxy fetch | **Retry**: request the version through the pkg.go.dev page; do not create a new tag for it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
