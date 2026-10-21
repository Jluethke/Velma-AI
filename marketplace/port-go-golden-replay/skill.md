# Port Go Golden Replay

**One-line description:** Builds a table-driven Go test that loads the frozen golden JSON Lines corpus from `testdata/golden`, decodes typed values with `json.Decoder.UseNumber`, `math/big` and `math.Float64frombits`, runs one `t.Run` subtest per record, compares under the schema's rules by bit pattern for doubles, and runs uncached and under the race detector.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_repo` (string, required): Path to the Go module.
- `golden_corpus` (object, required): Output of `port-golden-corpus-freeze`.
- `corpus_schema` (object, required): Output of `port-golden-corpus-schema`.

---

## Outputs

- `go_replay_command` (object): The exact commands: full replay, one behavior, one record, checksum check, and vet, plus harness file paths.

---

## Phase 1: Copy and Verify the Corpus

### Entry Criteria
- `golden_corpus.tag` exists in the source repository.

### Actions
1. Create a package for the replay, for example `internal/golden`, and copy the tagged corpus into its `testdata` directory: `git -C <source_repo> archive golden-v1 golden | tar -x -C internal/golden/testdata/`. The go tool ignores `testdata` directories when building packages, and tests run with the package directory as the working directory, so `os.ReadFile("testdata/golden/B-001.jsonl")` works.
2. Verify: `(cd internal/golden/testdata/golden && sha256sum -c SHA256SUMS)`.

### Output
Corpus in `testdata`.

### Quality Gate
- `sha256sum -c SHA256SUMS` exits 0.

---

## Phase 2: Write the Harness

### Entry Criteria
- Corpus in place.

### Actions
1. `internal/golden/codec.go`:
   - Decode records with `dec := json.NewDecoder(bytes.NewReader(line)); dec.UseNumber()` into `map[string]any`, so no number becomes `float64` by accident.
   - `$int`: `new(big.Int).SetString(s, 10)`; convert to `int64` with `IsInt64()` checked when the ported function takes `int64`.
   - `$f64`: `u, _ := strconv.ParseUint(h, 16, 64); math.Float64frombits(u)`; `"nan"` to `math.NaN()`.
   - `$bytes`: `base64.StdEncoding.DecodeString`.
   - `$badstr`: keep as `[]byte`; a Go `string` can hold invalid UTF-8, but `encoding/json` would replace it with U+FFFD when re-encoding, so never round-trip it through `json.Marshal`.
   - `encode(v any) any`: reverse mapping for results; floats by `fmt.Sprintf("%016x", math.Float64bits(f))` with NaN as `"nan"`.
2. `internal/golden/registry_test.go`: `var registry = map[string]func(args []any, kwargs map[string]any) (any, error){ "slugkit.slugify": func(...) {...} }`. Each adapter converts decoded args to the ported function's types and returns its result and error.
3. `internal/golden/golden_test.go`:
```go
func TestGolden(t *testing.T) {
    files, _ := filepath.Glob("testdata/golden/B-*.jsonl")
    for _, f := range files {
        recs := loadJSONL(t, f)
        for _, r := range recs {
            r := r
            t.Run(r.ID, func(t *testing.T) {
                fn, ok := registry[r.Call]
                if !ok { t.Skip("not ported yet") }
                got, err := fn(r.Args, r.Kwargs)
                compare(t, r, got, err)   // applies rules.json and categories.json
            })
        }
    }
}
```
   `t.Run` names are sanitized by the testing package (spaces become underscores); record ids like `B-001/0044` produce nested names, which is fine for `-run` filtering.
   - Error mapping: use `errors.Is(err, ErrX)` against the sentinels listed in `categories.json`'s Go section; an error matching no sentinel fails the test with "unmapped error".
   - `unordered` rule: sort both encoded slices by canonical JSON text before comparing.
4. `TestChecksums` in the same package recomputes SHA-256 with `crypto/sha256` and compares to `SHA256SUMS`.
5. Skipped (unported) records are allowed only before the port is finished; `port-parity-diff-triage` counts them.

### Output
Harness files.

### Quality Gate
- `go vet ./internal/golden/` prints nothing.
- With an empty registry, `go test ./internal/golden/ -run TestGolden -count=1 -v | grep -c -- "--- SKIP"` equals the record count.
- Changing one byte in a copied corpus file makes `TestChecksums` fail; restore with `git checkout -- internal/golden/testdata`.

---

## Phase 3: Prove the Comparator and Commands

### Entry Criteria
- Harness runs.

### Actions
1. In a scratch branch, register a stub that returns `0.0` where a record expects `-0.0` (`8000000000000000`): it must fail. Register a stub returning `nil` error where the record expects an error: it must fail. Delete the branch.
2. Record the commands. `-count=1` disables the test result cache, which would otherwise report `(cached)` and hide that nothing ran.

### Output
`go_replay_command`.

### Quality Gate
- Both stubs fail, with output attached.

---

## Worked Example

Illustrative.
```
$ go test ./internal/golden/ -run 'TestGolden/B-012' -count=1
--- FAIL: TestGolden (0.01s)
    --- FAIL: TestGolden/B-012/0007 (0.00s)
        golden_test.go:58: value mismatch at $.value: want {"$f64":"3ff0000000000000"} got {"$f64":"3fefffffffffffff"}
FAIL
```
The ported function summed in a different order than Python's `sum`; the fix is in the port, not the corpus.

`go_replay_command`:
```
{"full": "go test ./internal/golden/ -run TestGolden -count=1",
 "one_behavior": "go test ./internal/golden/ -run 'TestGolden/B-012' -count=1",
 "one_record": "go test ./internal/golden/ -run 'TestGolden/B-012/0007' -count=1 -v",
 "race": "go test ./... -race -count=1",
 "checksum": "go test ./internal/golden/ -run TestChecksums -count=1",
 "vet": "go vet ./..."}
```

---

## Exit Criteria

DONE when the tagged corpus is in `testdata`, every record is a named subtest (skipped until registered), the comparator catches `-0.0` and missing errors, and uncached commands are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Files placed outside `testdata` get compiled or embedded | **Adjust**: move them under `testdata`. |
| Phase 2 | Numbers decoded as `float64` | **Adjust**: `UseNumber()` was not set on the decoder that read the line. |
| Phase 2 | Error value matches no sentinel | **Adjust**: the port must wrap with `%w` around the sentinel; do not loosen `compare`. |
| Phase 3 | Test passes but output says `(cached)` | **Retry**: rerun with `-count=1`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
