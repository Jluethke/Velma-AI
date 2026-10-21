# Go Boundary Enforcement with internal Packages and depguard

**One-line description:** Enforces the Go module boundary first with the compiler's own `internal` directory rule (callers outside the candidate cannot import its `internal` subpackages) and then with golangci-lint's depguard rules that stop the candidate importing other domains, verified by a deliberate violating import that must fail the build or the lint.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Go module working tree.
- `module_interface` (object, required): From `mex-interface-boundary-contract`; names the public package (for example `example.com/shop/internal/billing`).

---

## Outputs

- `go_boundary_rules` (object): The moved internal package paths, the golangci-lint config file and version, the depguard rule names with their `files` and `deny` lists, the lint summary, and the mutation check results.

---

## Phase 1: Use the Compiler's internal Rule

### Entry Criteria
- `stack` is `go`.
- All callers already use the public `API` interface (from `mex-interface-boundary-contract`).

### Actions
1. The Go toolchain rejects an import of a path containing an `internal` element unless the importer is rooted at the parent of that `internal` directory. Use it: move implementation packages under the candidate's own `internal`, for example `internal/billing/store` becomes `internal/billing/internal/store`.
2. Move one package per commit with `git mv internal/billing/store internal/billing/internal/store`, then update import paths in the candidate only: `gofmt -l` must be clean and `go build ./...` must pass. Use `gopls rename` or your editor's rename if available; otherwise update imports with `rg -l '"example.com/shop/internal/billing/store"' | xargs sed -i 's#internal/billing/store"#internal/billing/internal/store"#'` and review `git diff`.
3. If `go build ./...` fails with `use of internal package ... not allowed`, an outside caller still uses the implementation package. That is a remaining boundary violation: route it through the API first, then repeat the move.

### Output
Implementation packages under `internal/billing/internal/`.

### Quality Gate
- `go build ./... && go test ./...` exit 0.
- `go list -f '{{.ImportPath}}' ./... | grep 'internal/billing/internal'` lists the moved packages.

---

## Phase 2: Forbid Outbound Imports with depguard

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Check the installed linter version: `golangci-lint --version`. Config layout differs: version 2 uses `version: "2"` with linter settings under `linters.settings`; version 1 uses top-level `linters-settings`. Write the form for the installed major version only.
2. Version 2 example (`.golangci.yml`):
   ```yaml
   version: "2"
   linters:
     enable:
       - depguard
     settings:
       depguard:
         rules:
           billing-no-other-domains:
             files:
               - "**/internal/billing/**"
             deny:
               - pkg: "example.com/shop/internal/orders"
                 desc: "billing must not depend on orders; use the OrderLookup port"
               - pkg: "example.com/shop/internal/catalog"
                 desc: "billing must not depend on catalog"
   ```
   For version 1, the same `rules` block sits under `linters-settings: depguard:`.
3. Run `golangci-lint run ./...`. Each finding prints the file, line and the `desc` text.
4. Fix each finding one file per commit by moving the dependency behind a port interface defined in billing (see `mex-seam-identification` row 7). Do not add `//nolint:depguard` comments to pass the check.

### Output
A depguard rule with zero findings.

### Quality Gate
- `golangci-lint run --enable-only depguard ./...` exits 0 (if your version lacks `--enable-only`, check `golangci-lint run --help` and run the full config).

---

## Phase 3: Mutation Checks and CI

### Entry Criteria
- Build and lint pass.

### Actions
1. Mutation A on a scratch branch: in `internal/orders/checkout.go` add `import _ "example.com/shop/internal/billing/internal/store"`. Run `go build ./...`. It must fail with `use of internal package`.
2. Mutation B: in a billing file add `import _ "example.com/shop/internal/orders"`. Run `golangci-lint run ./...`. It must report the depguard rule.
3. Delete the scratch branch. Confirm the CI workflow already runs `golangci-lint run` (for example the `golangci/golangci-lint-action` step); if not, add one step to the existing workflow file.

### Output
`go_boundary_rules`.

### Quality Gate
- Mutation A output contains `use of internal package`.
- Mutation B output contains `billing-no-other-domains` or its `desc` text.

---

## Worked Example

Illustrative.

```
$ git mv internal/billing/store internal/billing/internal/store
$ go build ./...
internal/admin/reports.go:9:2: use of internal package example.com/shop/internal/billing/internal/store not allowed
```
`internal/admin/reports.go` still read invoices from the store. Reverted the move, switched `reports.go` to `billing.API.ListInvoices`, committed, redid the move: `go build ./...` clean.

```
$ golangci-lint run ./...
internal/billing/dunning.go:7:2: import 'example.com/shop/internal/orders' is not allowed from list 'billing-no-other-domains': billing must not depend on orders; use the OrderLookup port (depguard)
```
Fixed by injecting `OrderLookup`; lint clean.

---

## Exit Criteria

DONE when implementation packages sit under the candidate's `internal` directory, depguard forbids imports of other domains, both mutation checks fail as expected, and CI runs the lint.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tests in another package import the store for fixtures | **Adjust**: provide a `billingtest` helper package next to the public API that builds fixtures through it. |
| Phase 2 | Config rejected with an unknown key | **Stop**: run `golangci-lint config verify` if available, read the depguard section of the docs for your version, and fix the layout. |
| Phase 2 | Allow-list mode blocks the standard library | **Adjust**: use `deny` lists only, or add `$gostd` to `allow` as the depguard docs describe. |
| Phase 3 | Mutation B passes lint | **Retry**: the `files` glob does not match; print the path with `go list -f '{{.Dir}}'` and fix the glob. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
