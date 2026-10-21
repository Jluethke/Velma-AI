# Go Failing Regression Test with go test

**One-line description:** Converts the minimal repro into one Go test (a table row or a standalone `TestXxx`, with `t.TempDir`, `t.Setenv` and `testdata/` fixtures) that fails today, run in isolation with `go test -run '^TestName$' -count=1 -v`, plus `-race` when the bug is a data race.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `minimal_repro` (object, required): Output of `repro-ddmin-minimize`.
- `minimal_input` (object, required): Output of `repro-ddmin-minimize`.
- `repo_path` (string, required): Absolute path to the local clone.

---

## Outputs

- `go_regression_test` (object): Package path, test file, test name (and subtest name if a table row), full source, the run command, and the red run output. Empty when `stack` is not go.

---

## Phase 1: Locate Package and Style

### Entry Criteria
- `go version` matches `env_snapshot`.
- `go vet ./...` output recorded (pre-existing warnings are noted, not fixed).

### Actions
1. Find the package that owns the failing function from `error_signature`: `go list -f '{{.ImportPath}} {{.Dir}}' ./... | grep <dir>`.
2. Open `<file>_test.go` next to it. Record whether it uses `package foo` (internal test, can call unexported functions) or `package foo_test` (external test, public API only). Use the same package clause as the existing file.
3. Record whether tests use plain `if got != want { t.Errorf(...) }`, `github.com/google/go-cmp/cmp`, or `github.com/stretchr/testify/require`. Use only what is already imported in `go.mod`; do not add a new assertion library.
4. If the function already has a table-driven test (`tests := []struct{...}` with `t.Run(tt.name, ...)`), add a row. Otherwise write a new `TestXxx`.

### Output
Chosen file, package clause, style.

### Quality Gate
- `go test -run '^$' ./<pkg>` (compiles tests, runs none) exits 0 before your change.

---

## Phase 2: Write the Test

### Entry Criteria
- Style known.

### Actions
1. Name: `Test<Func>_<Condition>` or a table row `name: "nil map on first insert"`.
2. Inputs: literal values inline; files go in the package's `testdata/` directory (the go tool ignores it for builds) and are read with `os.ReadFile(filepath.Join("testdata", "x.yaml"))`; scratch files use `dir := t.TempDir()` (removed automatically).
3. Environment: `t.Setenv("TZ", "America/Los_Angeles")` (cannot be used with `t.Parallel()`; it panics). Note that Go caches the local zone at first use of `time.Local`; for zone bugs construct the location explicitly with `time.LoadLocation` instead of relying on `TZ`.
4. Assertions:

| Bug kind | Assertion |
|---|---|
| Panic that should not happen | Call the function directly; the panic fails the test and prints the goroutine trace |
| Function should return an error | `if !errors.Is(err, ErrX) { t.Fatalf("got %v, want ErrX", err) }` or `errors.As` for typed errors |
| Wrong value (structs, slices, maps) | `if diff := cmp.Diff(want, got); diff != "" { t.Errorf("mismatch (-want +got):\n%s", diff) }` when go-cmp is a dependency; else `reflect.DeepEqual` |
| Data race | Write a test that runs the two operations from separate goroutines with a `sync.WaitGroup`; it is red when `go test -race` reports `WARNING: DATA RACE` |
| Deadlock / hang | Run the call in a goroutine and `select` on a done channel versus `time.After(<reported wait>)`, then `t.Fatal("timed out")` |

5. Do not call `t.Skip`, and do not add `//go:build` tags that exclude the test from the default build.
6. Edit only the `_test.go` file and `testdata/` files.

### Output
Test source.

### Quality Gate
- `gofmt -l <test file>` prints nothing.
- `git diff --stat` shows only `_test.go` and `testdata/` paths.

---

## Phase 3: Confirm the Red Run

### Entry Criteria
- Test written.

### Actions
1. Run: `go test ./<pkg> -run '^TestName$' -count=1 -v`. For a table row: `-run '^TestName$/^row_name$'` (spaces in subtest names become underscores). `-count=1` disables the test cache, which otherwise prints `(cached)` and replays an old result.
2. For a race bug: `go test ./<pkg> -run '^TestName$' -race -count=<confirm_runs from the repro> -v`.
3. Read the output: it must contain `--- FAIL: TestName` and either the panic text from `error_signature`, your `t.Errorf` diff showing the reported wrong value, or `WARNING: DATA RACE` with both stack traces in the package.
4. If the output has `FAIL ... [build failed]` or `[setup failed]`, the test does not compile; fix it, it is not red.

### Output
`go_regression_test` with red output.

### Quality Gate
- Output contains `--- FAIL: TestName` and the signature line.
- Output does not contain `[build failed]` and does not contain `(cached)`.

---

## Worked Example

Illustrative only.

```go
func TestLRU_PutOnZeroValue(t *testing.T) {
	var c LRU // zero value, as constructed by the caller in issue 812
	c.Put("k", 1)
	if v, ok := c.Get("k"); !ok || v != 1 {
		t.Fatalf("Get(k) = %v, %v; want 1, true", v, ok)
	}
}
```

`go test ./internal/cache -run '^TestLRU_PutOnZeroValue$' -count=1 -v`:

```
=== RUN   TestLRU_PutOnZeroValue
--- FAIL: TestLRU_PutOnZeroValue (0.00s)
panic: assignment to entry in nil map [recovered]
	internal/cache/lru.go:57 +0x...
FAIL	example.com/app/internal/cache	0.012s
```

Red confirmed with the reported panic.

---

## Exit Criteria

DONE when one Go test fails with the reported panic, error, wrong value or race report, uncached, and only test files changed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Failing function is unexported and existing tests use `package foo_test` | **Adjust**: add an `export_test.go` in `package foo` exposing it (`var LruPut = (*lru).put`), the standard Go pattern. |
| Phase 2 | Test needs `t.Setenv` and `t.Parallel` | **Adjust**: drop `t.Parallel()` for this test. |
| Phase 3 | Race test is green without `-race` | **Adjust**: expected; the gate for a race is the `-race` run. |
| Phase 3 | Weak model reruns without `-count=1` and reads a cached pass | **Retry**: rerun with `-count=1`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
