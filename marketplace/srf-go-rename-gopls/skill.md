# Go Rename Across the Module with gopls rename

**One-line description:** Renames a Go identifier (function, type, method, field, variable or package-level constant) everywhere it is referenced in the module using `gopls rename`, which is type-aware and refuses renames that would cause conflicts, then verifies build, vet, tests and `apidiff` and commits.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Module root.
- `test_command` (string, required): Full suite command.
- `characterization_tests` (object, required): From `srf-go-golden-master-tests`.
- `rename_target` (string, required): `<file>:<line>:<column>` of the identifier at its declaration, for example `render/render.go:22:6`.
- `new_name` (string, required): The new identifier. Exported names start uppercase, unexported lowercase.

---

## Outputs

- `step_commits` (string[]): SHA of the commit made by this step.
- `step_log` (object[]): Old and new names, files changed, string references found, test and API results, SHA.

---

## Phase 1: Plan the Rename

### Entry Criteria
- `git status --porcelain` is empty; `go build ./...` exits 0; `gopls version` works.

### Actions
1. Confirm the position names the identifier you expect: `gopls definition render/render.go:22:6` prints the declaration.
2. List references: `gopls references -d render/render.go:22:6` (`-d` includes the declaration). Count files.
3. Find references gopls cannot see: `git grep -n -w "<OldName>" -- ":!*.go"` (templates, YAML, docs, SQL, reflection keys) and `git grep -n "\"<OldName>\"" -- "*.go"` (strings in `reflect` or struct tags).
4. Apply this table:

| Situation | Decision |
|---|---|
| Old name exported and imported by other modules | Rename, then add `// Deprecated: use NewName.` forwarding declaration in Phase 2 so `apidiff` stays silent; or get user approval for a break. |
| Struct field with a `json:"..."` tag | Rename the Go field only; keep the tag value unchanged so the wire format does not change. Without a tag, add `json:"OldName"` first in its own step, or the JSON key changes. |
| Method that satisfies an interface | gopls renames the interface method and all implementations together; review that list. |
| Name used in `text/template` or `html/template` files | Edit those templates in the same commit; list each file. |
| Package name rename | Out of scope for this flow; use a package move procedure. |

### Output
Reference list, non-Go references, and decisions.

### Quality Gate
- `gopls definition` output matches the intended declaration.
- Every non-Go reference from step 3 is classified.

---

## Phase 2: Rename

### Entry Criteria
- Phase 1 complete.

### Actions
1. Preview: `gopls rename -d render/render.go:22:6 <new_name>`. Read the unified diff.
2. Apply: `gopls rename -w render/render.go:22:6 <new_name>`. gopls refuses with an error such as `renaming "X" to "Y" would conflict with ...` if the new name collides; choose another name rather than forcing.
3. Edit non-Go references from Phase 1 step 3 that must change (templates). Do not touch JSON tag values.
4. For an exported name with external users, add the forwarding declaration in the original file:
   `// Deprecated: Use RenderTable.` then `func RenderReport(w io.Writer, r Report) error { return RenderTable(w, r) }` for functions, or `type OldName = NewName` for types.
5. `gofmt -l .` must print nothing; `go build ./... && go vet ./...` must exit 0.
6. `git grep -n -w "<OldName>" -- "*.go"` must show only the forwarding declaration (if added) and comments you intentionally kept.

### Output
Renamed identifier across the module.

### Quality Gate
- `go build ./...` and `go vet ./...` exit 0.
- The step 6 grep matches the expected remaining lines exactly.

---

## Phase 3: Verify and Commit

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Run the golden test command, then `test_command`.
2. Run the `apidiff` check. A report of `<OldName>: removed` means the forwarding declaration is missing or wrong.
3. Green: `git commit -am "refactor: rename RenderReport to RenderTable"`. Red: `git checkout -- .` and report the failure; do not edit golden files.
4. Record `step_commits` and `step_log`.

### Output
`step_commits`, `step_log`.

### Quality Gate
- Tests exit 0; `apidiff` silent; `git status --porcelain` empty after commit.

---

## Worked Example

Illustrative only.
```
$ gopls references -d render/render.go:22:6 | wc -l
9
$ git grep -n -w RenderReport -- ':!*.go'
docs/usage.md:14:Call RenderReport with a Report value.
$ gopls rename -w render/render.go:22:6 RenderTable
$ go build ./... && go vet ./...
$ git grep -n -w RenderReport -- '*.go'
render/render.go:21:// Deprecated: Use RenderTable.
render/render.go:22:func RenderReport(w io.Writer, r Report) error { return RenderTable(w, r) }
$ go test ./... -count=1
ok   example.com/app/render  0.014s
```
`docs/usage.md` updated in the same commit.

---

## Exit Criteria

DONE when the identifier is renamed by gopls everywhere, non-Go references are handled, build, vet, tests and API check pass, and one commit holds the step.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Position points at a usage, not the declaration | **Adjust**: rename works from either, but confirm with `gopls definition` before applying. |
| Phase 2 | gopls reports a conflict | **Adjust**: pick a non-conflicting name; never rename the conflicting identifier as a side effect. |
| Phase 2 | Files with build tags not renamed | **Retry**: run with `GOFLAGS=-tags=<tag>` for each tag set found by `git grep -n "//go:build"`. |
| Phase 3 | `apidiff` reports removal | **Adjust**: add or fix the forwarding declaration. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
