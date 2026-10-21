# Go Vulnerability Scan With govulncheck

**One-line description:** Runs `govulncheck` in source mode so findings are split into vulnerabilities your code actually calls versus ones only present in imported packages or required modules, and records the fixed module version for each called finding first.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `runtime_version`, `work_dir`.
- `lockfile_status` (object, required): From `dup-go-module-hygiene`. Module tidy and verified.

---

## Outputs

- `vuln_findings` (object[]): One record per (module, OSV id): `ecosystem` (`go`), `name` (module path, or `stdlib`), `installed`, `advisory_id` (GO-YYYY-NNNN), `aliases` (CVE, GHSA), `reachability` (`called`, `imported`, `required`), `call_trace` (first trace for `called`), `min_fix`, `fix_update_type`. Also written to `<work_dir>/vulns.json`.

---

## Phase 1: Run govulncheck

### Entry Criteria
- `go build ./...` passes.

### Actions
1. Install: `go install golang.org/x/vuln/cmd/govulncheck@latest`. Record `govulncheck -version`.
2. Text run, which shows the summary humans read: `govulncheck ./... | tee .dep-upgrade/govulncheck.txt`.
3. JSON run for parsing: `govulncheck -format json ./... > .dep-upgrade/govulncheck.json`. (Newer versions also support `-format sarif` and `-format openvex`; check `govulncheck -h`.)
4. More detail on reachability for one finding: `govulncheck -show traces ./...` prints the full call stack from your function to the vulnerable symbol. `-show verbose` additionally lists vulnerabilities in imported packages and required modules.
5. Text mode exits non-zero (3) when called vulnerabilities are found; JSON mode exits 0. Neither is a tool error.
6. For a built binary instead of source: `govulncheck -mode binary ./bin/server`.

### Output
Text and JSON results.

### Quality Gate
- The text output contains the summary line (for example `Your code is affected by N vulnerabilities` or `No vulnerabilities found.`).

---

## Phase 2: Classify And Prioritize

### Entry Criteria
- Results exist.

### Actions
1. In the JSON stream, `osv` messages hold advisory data (`id`, `aliases`, `affected[].ranges` with `fixed` events), and `finding` messages hold `osv` id, `fixed_version`, and `trace` frames. A finding whose trace includes a `function` in your module is `called`; a trace that ends at a package is `imported`; a trace with only a module is `required`.
2. Priority table:

| reachability | Priority | Rule |
|---|---|---|
| `called` | 1 | must be fixed in this run or explicitly accepted by the user |
| `imported` | 2 | fix in this run when the fix is patch or minor |
| `required` | 3 | fix opportunistically; record |

3. `name=stdlib` (Go standard library) is fixed by upgrading the Go toolchain to `fixed_version`, not by `go get`. Record it as a runtime upgrade: update the `toolchain` directive (`go get toolchain@go1.N.M` or `go mod edit -toolchain=go1.N.M`) and CI's Go version.
4. `min_fix`: the finding's `fixed_version`. `fix_update_type` by semver, with v0 minor counted as major.
5. Merge into `<work_dir>/vulns.json` by (`ecosystem`, `name`, `advisory_id`).

### Output
`vuln_findings`.

### Quality Gate
- Every `called` record has a `call_trace` copied from `-show traces` output.
- Every `stdlib` record names a Go toolchain version.

---

## Worked Example

Illustrative only. API service on Go 1.22.3.

- Phase 1: `govulncheck ./...` prints `Vulnerability #1: GO-2024-2887 ... Found in: net/netip@go1.22.3 Fixed in: net/netip@go1.22.4` with a trace `api.parseClientAddr calls netip.ParseAddr`, then `Your code is affected by 1 vulnerability from the Go standard library.` and notes more vulnerabilities in imported packages not called.
- Phase 2: stdlib finding is `called`, priority 1, fix by `go mod edit -toolchain=go1.22.4` plus CI image change. `golang.org/x/net` finding is `imported`, `min_fix=v0.23.0`, `fix_update_type=major` (v0 minor), priority 2.

---

## Exit Criteria

DONE when every govulncheck finding is in `<work_dir>/vulns.json` with reachability, priority and fix version.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `govulncheck` cannot load packages (build tags, cgo) | **Adjust**: pass the build tags CI uses: `govulncheck -tags <tags> ./...`. |
| Phase 1 | No network to vuln.go.dev | **Adjust**: point `-db` at a local mirror only if the user has one; otherwise **Return** `scan_incomplete=true`. |
| Phase 2 | `called` finding with no fixed version | **Return**: record `no_fix=true`; the user decides to remove the call path or accept. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
