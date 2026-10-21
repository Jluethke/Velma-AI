# Go PR Security Scan with gosec and govulncheck

**One-line description:** Runs gosec on the changed packages and keeps only issues on changed lines, runs govulncheck on head and merge base to find newly reachable known vulnerabilities through the call graph, and audits new `#nosec` annotations and `go.mod` replace directives.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone with the PR head checked out.
- `base_branch` (string, required): PR target branch.
- `changed_files` (object[], required): Rename-aware file list.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `go_sast_findings` (object[]): New gosec issues, newly reachable vulnerabilities and module findings, written to `<findings_dir>/prr-go-gosec-govulncheck.json`.

---

## Phase 1: gosec on Changed Packages

### Entry Criteria
- At least one changed `.go` file; `gosec -version` succeeds (install: `go install github.com/securego/gosec/v2/cmd/gosec@latest`).

### Actions
1. Map changed files to package directories (`dirname` of each changed `.go` file), deduplicated.
2. Run with JSON output: `gosec -fmt=json -out=../gosec.json ./<dir1>/... ./<dir2>/...`
3. Each issue has `rule_id`, `severity`, `confidence`, `file`, `line`, `details`. Common rules:

| Rule | Meaning |
|---|---|
| G101 | Hardcoded credentials |
| G104 | Unhandled errors (audit) |
| G107 | HTTP request with a variable URL (SSRF candidate) |
| G201, G202 | SQL built with format string or concatenation |
| G204 | Subprocess launched with variable arguments |
| G304 | File path from a variable (path traversal candidate) |
| G401, G501 | Weak crypto (MD5, SHA1) |
| G402 | TLS `InsecureSkipVerify: true` or weak config |
| G404 | `math/rand` used where `crypto/rand` is needed |

4. Keep issues on changed lines only (match against `git diff -U0` hunk headers).

### Output
New gosec issues.

### Quality Gate
- `../gosec.json` parses with `python -m json.tool`.
- Every kept issue is on a changed line.

---

## Phase 2: govulncheck on Head and Base

### Entry Criteria
- `govulncheck -version` succeeds (install: `go install golang.org/x/vuln/cmd/govulncheck@latest`).

### Actions
1. Run on the head: `govulncheck ./... > ../vuln-head.txt`. govulncheck reports only vulnerabilities whose vulnerable function is reachable from your code via the call graph, so every reported item is relevant.
2. For structured output: `govulncheck -format json ./... > ../vuln-head.json`.
3. Run the same in a merge-base worktree, saving `../vuln-base.txt`.
4. A vulnerability (ID like `GO-2024-2687`) present in head but not base was introduced by the PR, either through a dependency change or by newly calling a vulnerable function. Text output shows "Vulnerability #N: GO-XXXX-YYYY", the module, "Found in: module@version", "Fixed in: module@version", and an example trace from your code.
5. Read `go.mod` diff for `replace` directives: `git diff origin/<base_branch>...HEAD -- go.mod | grep -n '^+replace'`. A replace pointing to a local path (`=> ../`) or a fork is a question; a local path replace committed to main breaks builds for others.

### Output
New vulnerabilities and module findings.

### Quality Gate
- Head and base govulncheck outputs are both recorded.
- Every new vulnerability lists its ID, the "Found in" and "Fixed in" versions, and the call trace.

---

## Phase 3: Suppressions and Findings

### Entry Criteria
- Phases 1 and 2 complete.

### Actions
1. Find added annotations: `git diff -U0 origin/<base_branch>...HEAD -- '*.go' | grep -nE '^\+.*(#nosec|//nolint:gosec)'`. An annotation must name the rule and a reason (`// #nosec G304 -- path is from the fixed config dir`); a bare one is a suggestion; one on a traced untrusted path is blocking.
2. Label:

| Result | Label |
|---|---|
| New reachable vulnerability with a "Fixed in" version | blocking: bump to the fixed version |
| New reachable vulnerability with no fix | question: ask for mitigation or a tracking issue |
| gosec HIGH severity with HIGH confidence on a changed line | blocking after you trace the input |
| gosec MEDIUM | question |
| gosec LOW | nit |
| `replace` to a local path | blocking |

3. Write `<findings_dir>/prr-go-gosec-govulncheck.json` (fields `flow`, `category`="sast", `file`, `line`, `evidence` = rule or vulnerability ID plus trace, `proposed_label`, `fix`) and validate with `python -m json.tool`.

### Output
`go_sast_findings`.

### Quality Gate
- Every finding has a gosec rule ID or Go vulnerability ID.
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. Changed: `internal/files/serve.go`, `go.mod` bumps `golang.org/x/net`.

- Phase 1: `gosec -fmt=json -out=../gosec.json ./internal/files/...` reports `G304` at `serve.go:27`: `os.Open(filepath.Join(root, r.URL.Query().Get("name")))`. Trace: query parameter reaches `os.Open`; `../` escapes `root`.
- Phase 2: head and base govulncheck outputs are identical: no new vulnerability. `go.mod` diff has no replace.
- Phase 3: G304 blocking, fix "reject names containing path separators, or use `os.Root` / `filepath.IsLocal` (check that the Go version in go.mod provides it) before opening".

---

## Exit Criteria

DONE when gosec ran on changed packages with results filtered to changed lines, govulncheck ran on head and base with new reachable vulnerabilities reported, and module replace directives and suppressions are audited.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | gosec fails to load packages (build tags, cgo) | **Adjust**: pass the tags CI uses with `-tags=<tags>` and rerun. |
| Phase 2 | govulncheck cannot reach vuln.go.dev | **Retry** once; then record "vulnerability check not run". |
| Phase 2 | Go version mismatch error | **Adjust**: run with the toolchain named in `go.mod`. |
| Phase 3 | Trace is unclear for a HIGH issue | **Adjust**: label it question with the gosec `details` text. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
