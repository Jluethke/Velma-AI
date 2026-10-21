# Go Test Isolation Fix

**One-line description:** Removes state shared between Go tests and between parallel packages by replacing package globals and process-wide changes with the `testing` helpers that undo themselves (`t.TempDir`, `t.Setenv`, `t.Chdir`, `t.Cleanup`), port-0 listeners and `httptest` servers, and per-package database names.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_cause_evidence` (object, required): Polluter and mechanism from `go_order_report`, or cross-package evidence.
- `flake_class` (string, required): `shared_state`, `test_order` or `parallel_collision`.
- `baseline_command` (string, required): Reproduction command.
- `repo_path` (string, required): Module root.

---

## Outputs

- `go_isolation_fix_diff` (string): Unified diff with a note per hunk.

---

## Phase 1: Name The Shared State

### Entry Criteria
- `flake_class` matches. Otherwise return an empty diff.

### Actions
1. From `root_cause_evidence`, take the polluter and mechanism, or for cross-package collisions the external resource.
2. List process-wide changes in the package's tests:
   `grep -n -E "os\.Setenv|os\.Chdir|os\.MkdirTemp\(\"\"|/tmp/|flag\.Set|http\.DefaultServeMux|http\.HandleFunc|http\.DefaultClient|time\.Local\s*=|:[0-9]{4,5}\"" <pkg>/*_test.go`
3. List package-level `var` declarations assigned in tests: `grep -n -E "^\s*[a-zA-Z_]+\s*=\s*" <pkg>/*_test.go` and match names against `var` blocks in the package.
4. Record Go version from `go.mod` (`go` directive). `t.Setenv` needs 1.17, `t.Chdir` needs 1.24, `-skip` needs 1.20.

### Output
Shared-state list.

### Quality Gate
- Each item names a file:line and whether it is test or product code.

---

## Phase 2: Apply Self-Undoing Helpers

### Entry Criteria
- List exists.

### Actions
1. One item at a time:

| Shared state | Fix |
|---|---|
| `os.Setenv` | `t.Setenv("KEY", "v")`: restored at test end. It panics if the test or an ancestor called `t.Parallel()`, by design: env is process-wide. |
| `os.Chdir` | `t.Chdir(dir)` on Go 1.24+; on older Go, avoid chdir and pass absolute paths |
| Fixed temp path | `dir := t.TempDir()`; removed automatically, unique per test |
| Package global set by a test | Save and restore: `old := pkgVar; pkgVar = v; t.Cleanup(func() { pkgVar = old })`. This is not safe with `t.Parallel()`; for parallel tests, inject the value through a parameter or struct field instead |
| `http.DefaultServeMux` registration | Use `mux := http.NewServeMux()` per test with `httptest.NewServer(mux)` and `t.Cleanup(srv.Close)` |
| Fixed listen port | `ln, _ := net.Listen("tcp", "127.0.0.1:0")`; read `ln.Addr().(*net.TCPAddr).Port` |
| `sync.Once` initialized with test values | Inject the dependency; or expose an unexported reset used only by tests in the same package |
| Shared database across packages (`go test ./...` runs packages in parallel up to `-p`) | Database or schema name derived from the package (for example a constant per package) or a random suffix created in `TestMain` and dropped after `m.Run()` |
| Parallel subtests sharing a parent variable | Give each subtest its own copy before `t.Run` |

2. Do NOT add `-p 1` or `-parallel 1` to CI, remove `t.Parallel()` calls, or rename tests to change their order. Those hide the leak.
3. Rerun `baseline_command` once after each item.

### Output
Edited tests and, where needed, product code injection points.

### Quality Gate
- `go vet ./<pkg>` exits 0.
- `baseline_command` passes once.

---

## Phase 3: Shuffle, Parallel And Diff

### Entry Criteria
- All items fixed.

### Actions
1. `go test ./<pkg> -count=1 -shuffle=on -race` three times; record the three printed `-test.shuffle` seeds.
2. For cross-package collisions: `go test ./... -count=1` with the CI `-p` value and with `-p` set to the machine's CPU count.
3. `gofmt -l` on changed files must print nothing.
4. `git -C <repo_path> diff > flk-go-iso.diff`; copy into `go_isolation_fix_diff`; delete it.

### Output
`go_isolation_fix_diff`.

### Quality Gate
- Three shuffled runs exit 0 with their seeds recorded.
- Cross-package runs (when applicable) exit 0.

---

## Worked Example

Illustrative. Polluter `TestCurrencyEUR` sets package var `defaultRounding = roundDown`.

- Phase 1: one item, `currency_test.go:17`, test code. go.mod says `go 1.22`.
- Phase 2: `old := defaultRounding; defaultRounding = roundDown; t.Cleanup(func() { defaultRounding = old })`. The test does not call `t.Parallel()`, so save and restore is safe.
- Phase 3: `-shuffle=on -race` seeds 1718040011, 1718040053, 1718040097 all `ok`. Diff: 1 file, 2 insertions, 1 deletion.

---

## Exit Criteria

DONE when every shared-state item uses a self-undoing helper or injection, shuffled race runs pass, and the diff is gofmt-clean.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `flake_class` not matched | **Return**: empty diff. |
| Phase 2 | `t.Setenv` panics because the test is parallel | **Adjust**: pass the value as a parameter instead of env, or drop `t.Parallel()` for that one test with a comment saying env is process-wide. |
| Phase 3 | Shuffle run fails on a new seed | **Return**: to `flk-go-shuffle-order-detect` with that seed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
