# Go Package Graph with go list and go mod graph

**One-line description:** Maps which Go packages import the candidate package tree and which packages it imports, using `go list` templates for package edges (including test imports) and `go mod graph` and `go mod why` for third-party module edges, so the extraction knows its exact Go dependency surface.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Monolith working tree containing `go.mod`.
- `extraction_brief` (object, required): From `mex-extraction-candidate-brief`; supplies `candidate_module` (for example `internal/billing`).

---

## Outputs

- `go_package_graph` (object): `module_path`, `candidate_import_path`, `inbound_edges` (importer package, imported candidate package, file and line), `outbound_edges`, `test_only_edges`, `third_party_modules` used by the candidate with `go mod why -m` evidence, and `shared_packages`.

---

## Phase 1: Resolve Import Paths

### Entry Criteria
- `extraction_brief.stack` == `go`.
- `go build ./...` succeeds at `baseline_sha`.

### Actions
1. Read the module path: `go list -m` (prints for example `example.com/shop`).
2. Candidate import path = module path + `/` + candidate dir, for example `example.com/shop/internal/billing`. Confirm: `go list example.com/shop/internal/billing/...` lists at least one package.
3. If the repo uses build tags that change imports (for example `//go:build integration`), record them; run every `go list` in this flow once without tags and once with `-tags <tag>` for each tag found by `rg -n "^//go:build" | cut -d: -f3 | sort -u`.

### Output
`module_path`, `candidate_import_path`, tag list.

### Quality Gate
- `go list <candidate>/...` exits 0 and prints one or more packages.

---

## Phase 2: Package-Level Edges

### Entry Criteria
- Import paths resolved.

### Actions
1. Dump direct imports for every package, one edge per line:
   ```
   go list -f '{{$p := .ImportPath}}{{range .Imports}}{{$p}} {{.}}{{"\n"}}{{end}}' ./... > /tmp/mex_go_edges.txt
   ```
2. Dump test imports separately (they are not in `.Imports`):
   ```
   go list -f '{{$p := .ImportPath}}{{range .TestImports}}{{$p}} {{.}}{{"\n"}}{{end}}{{range .XTestImports}}{{$p}} {{.}}{{"\n"}}{{end}}' ./... > /tmp/mex_go_test_edges.txt
   ```
3. Inbound: `awk -v c="example.com/shop/internal/billing" 'index($1,c)!=1 && index($2,c)==1' /tmp/mex_go_edges.txt | sort -u`.
4. Outbound inside the module: `awk -v c="example.com/shop/internal/billing" -v m="example.com/shop/" 'index($1,c)==1 && index($2,c)!=1 && index($2,m)==1' /tmp/mex_go_edges.txt | sort -u`.
5. For each inbound edge, find the file and line: `rg -n '"example.com/shop/internal/billing' <importer dir> --glob '*.go'`.
6. Go forbids import cycles between packages, so there are no package cycles to list. Instead list `shared_packages`: outside packages that both import the candidate and are imported by it through a third package. Compute with `go list -deps -f '{{.ImportPath}}' example.com/shop/internal/billing/... | grep '^example.com/shop/' | grep -v internal/billing` (everything the candidate needs from the module).

### Output
Inbound, outbound and test-only edges with locations; candidate's in-module dependency closure.

### Quality Gate
- `wc -l` of the inbound awk output equals the length of `inbound_edges`.
- Every inbound edge has a file path and line from `rg`.

---

## Phase 3: Third-Party Module Edges

### Entry Criteria
- Package edges listed.

### Actions
1. List non-standard-library packages the candidate needs: `go list -deps -f '{{if not .Standard}}{{.ImportPath}}{{end}}' example.com/shop/internal/billing/... | grep -v '^example.com/shop/'`.
2. Map packages to modules: `go list -deps -f '{{with .Module}}{{.Path}} {{.Version}}{{end}}' example.com/shop/internal/billing/... | sort -u`.
3. For each module, record why the main module needs it: `go mod why -m <module>`. A module used only by the candidate moves with it; a module also used elsewhere stays in both `go.mod` files after a split.
4. Use `go mod graph | grep '^<module>@'` only to read module-to-module requirements (it prints `a@v b@v` lines at module level, not package level). Do not use it for package edges.

### Output
`go_package_graph`.

### Quality Gate
- Every entry in `third_party_modules` has a `go mod why -m` output attached.

---

## Worked Example

Illustrative. Module `example.com/shop`, candidate `internal/billing`.

```
$ go list -m
example.com/shop
$ awk -v c="example.com/shop/internal/billing" 'index($1,c)!=1 && index($2,c)==1' /tmp/mex_go_edges.txt | sort -u
example.com/shop/internal/orders example.com/shop/internal/billing
example.com/shop/internal/admin example.com/shop/internal/billing/store
example.com/shop/cmd/worker example.com/shop/internal/billing
$ go mod why -m github.com/stripe/stripe-go/v76
# github.com/stripe/stripe-go/v76
example.com/shop/internal/billing/psp
github.com/stripe/stripe-go/v76
```
Finding: `internal/admin` imports `billing/store` directly (the repository layer), bypassing the billing package API. The Stripe module is used only by billing and moves with it.

---

## Exit Criteria

DONE when `go_package_graph` lists inbound, outbound and test-only package edges with file and line, and every third-party module the candidate needs with `go mod why` evidence.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `go list` reports `cannot find module providing package` | **Adjust**: run from the directory with `go.mod`; for a `go.work` workspace run inside the member module. |
| Phase 2 | Generated code (protobuf, sqlc) dominates edges | **Adjust**: tag edges whose file has a `// Code generated` header as `generated` and summarize them separately. |
| Phase 2 | cgo or build-tag files missing | **Retry**: rerun with `-tags` and with `CGO_ENABLED=1`. |
| Phase 3 | `go mod why` prints `(main module does not need module ...)` | **Return**: the module is in `go.mod` but unused; note it and do not count it as a candidate dependency. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
