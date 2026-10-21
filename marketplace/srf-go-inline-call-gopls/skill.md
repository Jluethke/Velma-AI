# Go Inline Call with the gopls Inliner

**One-line description:** Inlines calls to a small Go function using gopls's `refactor.inline.call` code action, whose inliner preserves argument evaluation order and side effects by introducing temporaries when needed, then verifies with `go vet`, tests, `apidiff` and one commit per call site batch.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Module root.
- `test_command` (string, required): Full suite command, for example `go test ./... -count=1`.
- `characterization_tests` (object, required): From `srf-go-golden-master-tests`; must cover the call sites.
- `inline_target` (string, required): `<file>:<line>:<column>` of one call expression to inline, for example `render/render.go:57:12`, or of the function name in its declaration when all calls are to be inlined.

---

## Outputs

- `step_commits` (string[]): SHAs of the commits made by this step.
- `step_log` (object[]): Call sites inlined, files changed, vet, test and API results, SHAs.

---

## Phase 1: Check Tooling and Target

### Entry Criteria
- `git status --porcelain` is empty; `go build ./...` exits 0.

### Actions
1. `go install golang.org/x/tools/gopls@latest`, then `gopls version`. Record the version.
2. Run `gopls codeaction -h`. Confirm the subcommand exists and note its flags for choosing the kind (`-kind`), executing (`-exec`), and writing (`-write`) or diffing (`-diff`). If `codeaction` is missing, the gopls version is too old; upgrade or stop. Do not guess flags.
3. List available actions at the call: `gopls codeaction -kind=refactor.inline.call render/render.go:57:12`. Expect a line naming an inline call action. No line means the position is not on a call expression; adjust the column to the function name inside the call.
4. Classify the callee with this table:

| Callee property | Decision |
|---|---|
| Method called through an interface value | Stop: static inlining of a dynamic call is not possible. |
| Function uses `defer` or `recover` | Allowed by gopls only in some forms; read the diff carefully in Phase 2. |
| Callee is in another package and refers to that package's unexported names | gopls refuses; Stop. |
| Exported function also used by other modules | Inline call sites, but keep the declaration; deleting it is an API break that `apidiff` will report. |
| Small helper, all calls inside this module | Allowed. |

### Output
Confirmed tool, action available, callee classification.

### Quality Gate
- Step 3 printed an inline action for the position.
- The callee classification is recorded with the table row.

---

## Phase 2: Inline and Review

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Preview the edit: `gopls codeaction -kind=refactor.inline.call -exec -diff render/render.go:57:12`.
2. Read the diff. The gopls inliner may bind arguments to new local variables (`var x = expr`) or wrap the body in a function literal to keep semantics; that is expected and correct. Do NOT simplify these by hand in the same step.
3. Apply: same command with `-write` in place of `-diff`.
4. Run `gofmt -l .` (must print nothing) and `go vet ./...` (must exit 0).
5. To inline the remaining call sites, repeat steps 1 to 4 per site. Find them with `gopls references render/render.go:<decl line>:<decl col>`; positions shift after each edit, so rerun `gopls references` each time.
6. After the last call site, if Phase 1 allowed deletion, delete the now-unused declaration and confirm `go build ./...` passes. If the function is exported and used outside the module, keep it.

### Output
Inlined call sites, formatted and vetted.

### Quality Gate
- `gofmt -l .` prints nothing; `go vet ./...` exits 0.
- `gopls references` on the declaration lists only the sites you meant to keep.

---

## Phase 3: Verify and Commit

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Run the golden tests command from `characterization_tests`, then `test_command`, then `go test -race ./<pkg>/... -count=1` for the touched packages.
2. Run the `apidiff` check command if `.refactor/api/` exists.
3. Green: `git commit -am "refactor: inline formatCell at 3 call sites"`. Red: `git checkout -- .`, retry one call site at a time, committing each green site separately.
4. Record SHAs and `step_log`.

### Output
`step_commits`, `step_log`.

### Quality Gate
- All test commands exit 0, golden files unchanged (`git status --porcelain` empty after the run and the commit).
- `apidiff` check silent.

---

## Worked Example

Illustrative only. `formatCell(v int) string { return fmt.Sprintf("%6d", v) }` called 3 times.
```
$ gopls codeaction -kind=refactor.inline.call -exec -diff render/render.go:57:12
--- render/render.go.orig
+++ render/render.go
-	line += formatCell(r.Value)
+	line += fmt.Sprintf("%6d", r.Value)
$ gopls codeaction -kind=refactor.inline.call -exec -write render/render.go:57:12
$ go vet ./... && go test ./... -count=1
ok   example.com/app/render  0.015s
```

---

## Exit Criteria

DONE when the chosen call sites are inlined by gopls, code is formatted and vetted, tests and API check pass, and each green batch is committed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `codeaction` subcommand unknown | **Adjust**: upgrade gopls; if still missing, stop and report the version. |
| Phase 1 | No inline action at position | **Adjust**: move the column onto the callee identifier in the call. |
| Phase 2 | Inliner output wraps the body in `func() {...}()` | **Adjust**: accept it; simplification is a separate, tested step. |
| Phase 3 | Golden mismatch | **Retry**: revert and inline one site per commit to isolate the change. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
