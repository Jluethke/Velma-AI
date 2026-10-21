# Go Golden Master Tests with testdata Golden Files

**One-line description:** Pins the current behavior of the Go package you are about to refactor with table-driven golden file tests under `testdata/`, an `-update` flag to regenerate them, `cmp.Diff` output on mismatch, and `go test -coverprofile` evidence that every target line runs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Module root containing `go.mod`.
- `target_paths` (string[], required): Package paths and functions to refactor, for example `["./internal/render#RenderReport"]`.
- `test_command` (string, required): Full suite command, normally `go test ./... -count=1`.
- `baseline_commit` (string, required): SHA from `srf-baseline-green-check`.

---

## Outputs

- `characterization_tests` (object): Golden test file path, `testdata/*.golden` paths, the run command, and the update command.
- `target_coverage` (object): Per target function coverage percentage from `go tool cover -func`, and uncovered blocks from the HTML or profile.

---

## Phase 1: Inventory and Determinism

### Entry Criteria
- `go version` succeeds and `go.mod` exists in `repo_path`.
- HEAD equals or descends from `baseline_commit` with no source changes.

### Actions
1. For each target function list its observable effects: return values, returned `error` text (`err.Error()`), bytes written to an `io.Writer`, mutated struct fields.
2. Find real inputs: `git grep -n "RenderReport(" -- "*.go"`. Collect 3 or more argument sets from callers and existing tests.
3. Find non-determinism and pick a control:

| Source | Control |
|---|---|
| Ranging over a `map` | Sort keys in the test output (`slices.Sorted(maps.Keys(m))` on Go 1.23+, else `sort.Strings`). Never add sorting to the target. |
| `time.Now()` | Only controllable if the code accepts a clock or `now func() time.Time`. If it does not, record as open question; do not add a seam in this flow. |
| Goroutine ordering in output | Collect results and sort before writing the golden file. |
| Absolute paths in output | Replace `t.TempDir()` prefix with `<TMP>` in the test before comparing. |

4. Do NOT edit the target package's non-test files in this flow.

### Output
Behavior inventory and controls.

### Quality Gate
- Each target has listed inputs and effects.
- Each non-deterministic source has a control or an open question entry.

---

## Phase 2: Write the Golden Test

### Entry Criteria
- Phase 1 complete.

### Actions
1. Create `internal/render/render_golden_test.go` in the same package (`package render`) so unexported helpers stay reachable. Add `github.com/google/go-cmp/cmp` only if it is already in `go.mod`; otherwise compare with `bytes.Equal` and print both values.
2. Write the test with an `-update` flag. The flag name is a convention you define, not a built-in `go test` flag:
```go
var update = flag.Bool("update", false, "rewrite golden files")

func TestRenderReportGolden(t *testing.T) {
    cases := []struct{ name string; in Report }{
        {"empty", Report{}},
        {"two_rows", Report{Rows: []Row{{"a", 1}, {"b", 2}}}},
        {"negative", Report{Rows: []Row{{"x", -5}}}},
    }
    for _, tc := range cases {
        t.Run(tc.name, func(t *testing.T) {
            var buf bytes.Buffer
            err := RenderReport(&buf, tc.in)
            got := fmt.Sprintf("err=%v\n%s", err, buf.String())
            path := filepath.Join("testdata", t.Name()+".golden")
            if *update {
                os.MkdirAll(filepath.Dir(path), 0o755)
                if err := os.WriteFile(path, []byte(got), 0o644); err != nil { t.Fatal(err) }
            }
            want, err := os.ReadFile(path)
            if err != nil { t.Fatalf("missing golden %s: run with -update", path) }
            if diff := cmp.Diff(string(want), got); diff != "" {
                t.Errorf("mismatch (-want +got):\n%s", diff)
            }
        })
    }
}
```
3. `t.Name()` contains a slash for subtests (`TestRenderReportGolden/empty`), so files land in `testdata/TestRenderReportGolden/empty.golden`. The `go` tool ignores the `testdata` directory when building.
4. Record: `go test ./internal/render -run TestRenderReportGolden -count=1 -update`.
5. Read every `.golden` file. Any pointer address (`0xc000...`), wall-clock time or random id means a missing control.
6. Verify: `go test ./internal/render -run TestRenderReportGolden -count=1` twice, then once with `-race`.

### Output
Golden test file and `testdata/` golden files.

### Quality Gate
- The verify command exits 0 twice without `-update`, and once with `-race`.
- `git status --porcelain` shows no modified golden file after the verify runs.
- `grep -rn "0xc0" internal/render/testdata` prints nothing.

---

## Phase 3: Coverage Evidence and Commit

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. `go test ./internal/render -run TestRenderReportGolden -count=1 -covermode=count -coverprofile=/tmp/golden.out`
2. `go tool cover -func=/tmp/golden.out | grep -E "RenderReport|total"` shows per-function percentages.
3. For uncovered blocks, read lines in the profile with count `0` (format `file:startLine.startCol,endLine.endCol numStmts count`) or open `go tool cover -html=/tmp/golden.out`. Add a case per uncovered block inside a target function and rerun Phase 2 steps 4 to 6.
4. Mutation check: change one operator in the target, run the verify command, confirm a `mismatch (-want +got)` failure, restore with `git checkout -- internal/render/render.go`.
5. Commit: `git add internal/render/render_golden_test.go internal/render/testdata && git commit -m "test: golden master for RenderReport before refactor"`.

### Output
`characterization_tests`, `target_coverage`.

### Quality Gate
- Every target function shows `100.0%` in `go tool cover -func`, or each remaining zero-count block is recorded as `unreachable_candidate`.
- The step 4 mutation failed the golden test.
- `git show --stat HEAD` lists only `_test.go` and `testdata/` files.

---

## Worked Example

Illustrative only.
```
$ go test ./internal/render -run TestRenderReportGolden -count=1 -update
ok   example.com/app/internal/render  0.012s
$ go tool cover -func=/tmp/golden.out | grep RenderReport
example.com/app/internal/render/render.go:22:  RenderReport  83.3%
```
The profile shows `render.go:47.18,49.3 2 0`: the branch for a row with an empty label. Case `{"empty_label", Report{Rows: []Row{{"", 3}}}}` added, regenerated, coverage now `100.0%`. Changing `if r.Value < 0` to `if r.Value <= 0` prints `mismatch (-want +got)` for `negative`. Restored, committed.

---

## Exit Criteria

DONE when golden tests pass twice without `-update` and once with `-race`, each target function is fully covered or its gaps are listed, a mutation is caught, and the tests are committed alone.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Target reads `time.Now()` directly | **Return**: record an open question; adding a clock parameter is a refactoring step of its own. |
| Phase 2 | `flag redefined: update` panic | **Adjust**: another test file in the package already defines it; reuse that variable. |
| Phase 2 | Golden differs between runs | **Retry**: sort map or goroutine output in the test. |
| Phase 3 | Coverage shows 0% because of the test cache | **Retry**: keep `-count=1`. |
| Phase 3 | Mutation not caught | **Retry**: add a case that crosses the mutated boundary. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
