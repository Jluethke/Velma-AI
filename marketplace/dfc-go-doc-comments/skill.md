# Go Doc Comments Per go.dev/doc/comment

**One-line description:** Brings a Go module's doc comments to the official Go doc comment format (package comment, comments that start with the declared name, `Deprecated:` paragraphs, doc links in square brackets) and enforces it with staticcheck's ST1000 and ST1020 to ST1022 checks and `gofmt`, one package at a time.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the module root (contains `go.mod`).

---

## Outputs

- `docstring_config` (string): The lint configuration changed: `staticcheck.conf` or the `linters-settings` block in `.golangci.yml`.
- `docstring_report` (object[]): Per package: exported identifiers, identifiers without a conforming comment before and after, package comment present (yes/no).

---

## Phase 1: Baseline Missing and Malformed Comments

### Entry Criteria
- `go version` prints a version of 1.19 or later (the release that added doc comment headings, lists and links, and taught `gofmt` to reformat them).
- `go build ./...` succeeds.

### Actions
1. Install staticcheck at a released version: `go install honnef.co/go/tools/cmd/staticcheck@latest`, then `staticcheck -version`.
2. Run only the documentation checks, which are not in staticcheck's default set: `staticcheck -checks 'ST1000,ST1020,ST1021,ST1022' ./...`.

   | Check | Meaning |
   |---|---|
   | ST1000 | Package is missing a package comment, or it is malformed |
   | ST1020 | Comment on an exported function does not start with the function name |
   | ST1021 | Comment on an exported type does not start with the type name |
   | ST1022 | Comment on an exported variable or constant does not start with its name |

3. List exported identifiers with no comment at all (staticcheck only checks comments that exist): for each package from `go list ./...`, run `go doc -all <import/path>` and look for declarations with no text under them.
4. Skip packages under `internal/` for the public report, but still fix ST1000 there if contributors are a persona.

### Output
Baseline per package.

### Quality Gate
- The staticcheck command ran and every finding is recorded with check ID, file and line.

---

## Phase 2: Configure the Gate

### Entry Criteria
- Baseline recorded.

### Actions
1. Choose where to configure:

   | Repo uses | Configuration |
   |---|---|
   | golangci-lint (`.golangci.yml` exists) | Enable `staticcheck` (it includes the ST checks in golangci-lint v2) and/or `stylecheck` (v1), then list the ST checks; confirm key names with `golangci-lint help linters` and the docs for the installed major version |
   | staticcheck directly | Create `staticcheck.conf` at the module root |

2. `staticcheck.conf` content:
   ```toml
   checks = ["inherit", "ST1000", "ST1020", "ST1021", "ST1022"]
   ```
   `inherit` keeps the default checks and adds the four documentation checks.
3. Do NOT add `-checks all`; it turns on checks unrelated to documentation and produces noise the user did not ask for.

### Output
`docstring_config`.

### Quality Gate
- `staticcheck ./...` (no `-checks` flag) reports the same ST1000 to ST1022 findings as the Phase 1 command, proving the config is read.

---

## Phase 3: Write Comments Package by Package

### Entry Criteria
- Gate configured.

### Actions
1. Package comment: put it directly above `package <name>` in exactly one file; for long text use a file named `doc.go`. It starts with `Package <name>` followed by a verb phrase: `// Package ratelimit provides token-bucket rate limiters for HTTP handlers.`
2. Declaration comments start with the identifier and are complete sentences:
   ```go
   // Limiter allows events up to a rate with bursts of at most Burst tokens.
   // A zero Limiter allows no events.
   type Limiter struct { ... }

   // Wait blocks until the limiter permits one event or ctx is done.
   // It returns ctx.Err() when ctx ends first.
   func (l *Limiter) Wait(ctx context.Context) error { ... }
   ```
3. Go 1.19+ syntax inside comments:
   - Heading: a line `// # Heading Text` with blank comment lines around it.
   - Code block: indent with a tab or extra spaces after `//`.
   - Doc link: `[Limiter.Wait]`, `[context.Context]`.
   - URL link: `[RFC 6585]` in text plus a definition line `// [RFC 6585]: https://www.rfc-editor.org/rfc/rfc6585`.
   - Deprecation: a paragraph starting `// Deprecated: Use [NewLimiter] instead.` (tools such as gopls and pkg.go.dev recognize this exact prefix).
4. Edit ONE package, then run in order: `gofmt -l <pkg_dir>` (prints files that need formatting; run `gofmt -w <file>` to fix them, since it reformats doc comments too), `staticcheck ./<pkg_dir>/...`, `go vet ./<pkg_dir>/...`, `go test ./<pkg_dir>/...`.
5. Describe behavior from the code you read. Do NOT invent zero-value semantics or concurrency guarantees; if the code has no mutex, do not write "safe for concurrent use".

### Output
`docstring_report`.

### Quality Gate
- `staticcheck ./...; echo $?` prints `0` last.
- `gofmt -l .` prints nothing.
- `go test ./...` passes.

---

## Worked Example

Illustrative only. Phase 1:
```
$ staticcheck -checks 'ST1000,ST1020,ST1021,ST1022' ./...
ratelimit/limiter.go:1:1: at least one file in a package should have a package comment (ST1000)
ratelimit/limiter.go:31:1: comment on exported function NewLimiter should be of the form "NewLimiter ..." (ST1020)
```
Phase 3: create `ratelimit/doc.go`:
```go
// Package ratelimit provides token-bucket rate limiters for HTTP handlers.
//
// # Choosing a rate
//
// Rates are events per second; see [Limit].
package ratelimit
```
Change `// creates a limiter` to `// NewLimiter returns a Limiter that allows r events per second.`. `staticcheck ./...` prints nothing and exits 0; `go doc ratelimit` shows the new package text.

---

## Exit Criteria

DONE when every non-internal package has one package comment, every exported identifier has a comment starting with its name, staticcheck with the documentation checks exits 0, `gofmt -l` is empty and tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Go older than 1.19 | **Adjust**: write comments without headings, lists or doc links; record the toolchain version as an open item. |
| Phase 2 | golangci-lint config keys rejected | **Adjust**: run `golangci-lint config verify` (v2) and follow the reported schema; do not guess keys. |
| Phase 3 | Generated files (`// Code generated ... DO NOT EDIT.`) flagged | **Adjust**: leave them unedited; staticcheck skips generated files for most checks; fix the generator template instead if needed. |
| Phase 3 | Tests fail after edits | **Stop**: an edit touched code; revert with `git checkout -p` and redo comments only. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
