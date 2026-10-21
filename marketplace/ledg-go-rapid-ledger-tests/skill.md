# Ledger Go rapid Property Tests

**One-line description:** Writes property tests for a Go ledger with `pgregory.net/rapid` (including a state machine over post, replay and reverse) plus a native `go test -fuzz` target for the amount parser, checking balanced entries, sum-preserving allocation, net-zero reversals and idempotent replays, with saved failing cases.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `posting_service` (object, required): Output of `ledg-pg-idempotent-posting`.
- `allocation_function` (object, required): Output of `ledg-allocate-remainder`.

---

## Outputs

- `go_property_tests` (object): Test file paths, properties and generators, the commands run, summaries, and any failing case found with its fix.

---

## Phase 1: Pure Properties

### Entry Criteria
- `go list -m pgregory.net/rapid` prints a version; add it with `go get pgregory.net/rapid` after user approval.
- `go test ./...` passes before adding tests.

### Actions
1. Create `money/money_property_test.go`. Bound amounts by `int64`: `maxAbs := int64(math.MaxInt64) / int64(n)` where `n` is the largest posting count the API accepts.
2. Allocation:
```
func TestAllocateSums(t *testing.T) {
    rapid.Check(t, func(t *rapid.T) {
        total := rapid.Int64Range(-maxAbs, maxAbs).Draw(t, "total")
        w := rapid.SliceOfN(rapid.Int64Range(0, 1_000_000), 1, 20).Draw(t, "w")
        w[len(w)-1]++ // guarantee a positive weight
        parts, err := Allocate(total, w)
        if err != nil { t.Fatalf("allocate: %v", err) }
        var sum int64
        for _, p := range parts { sum += p }
        if sum != total { t.Fatalf("sum %d != total %d", sum, total) }
    })
}
```
Slice length and weight ranges are test-input ranges; set them to what callers send.
3. Canonical hash property: permuting postings (`rapid.Permutation(postings).Draw(t, "perm")`) keeps the hash; changing one amount by 1 changes it.
4. Native fuzz target for the parser:
```
func FuzzParse(f *testing.F) {
    f.Add("1.00", "USD"); f.Add("-0.01", "USD"); f.Add("5", "JPY")
    f.Fuzz(func(t *testing.T, s, cur string) {
        m, err := Parse(s, cur)
        if err != nil { return }
        back, err := Parse(Format(m), cur)
        if err != nil || back != m { t.Fatalf("round trip %q -> %v -> %v", s, m, back) }
    })
}
```
5. Run `go test ./money -run 'TestAllocateSums|TestHash' -v` then `go test ./money -run '^$' -fuzz FuzzParse -fuzztime <duration>` where the duration is the user's choice. rapid's check count defaults to 100 and is set with the `-rapid.checks` test flag.

### Output
Pure properties and fuzz target passing.

### Quality Gate
- `go test ./money -v` reports `PASS` for each property test.
- The fuzz run ends without `--- FAIL`; if it failed, the input file under `testdata/fuzz/FuzzParse/` is committed as a regression and passes after the fix.

---

## Phase 2: Database State Machine

### Entry Criteria
- Phase 1 passes; a test PostgreSQL database with the ledger schema is reachable through an environment variable such as `LEDGER_TEST_DSN`.

### Actions
1. Write a state machine with rapid's `T.Repeat` taking a map of named actions (check `go doc pgregory.net/rapid T.Repeat` for your version):
   - `"post"`: balanced entry with a fresh key.
   - `"replay"`: repost a recorded key and payload; assert `replayed` and no new rows.
   - `"reverse"`: reverse an unreversed entry.
   - `""` (the empty-name action is the invariant check run after each step): per-currency posting sum is 0 and `account_balances` equals posting sums when present.
2. Each `rapid.Check` iteration runs in its own `tx, _ := db.BeginTx(ctx, nil)` and ends with `tx.Rollback()` in a `defer`.
3. On failure rapid prints the minimized action sequence and saves a fail file under `testdata/rapid/`; rerunning `go test` replays it. Fix the code, then turn the sequence into a plain table-driven regression test.
4. Run `go test ./... -race` once at the end.
5. Do not shrink generator ranges, skip actions, or call `t.Skip` to hide a failure.

### Output
`go_property_tests`.

### Quality Gate
- `go test ./...` and `go test -race ./...` exit 0.
- `rg -n "t\.Skip" money/` shows no skip added by this flow.

---

## Worked Example

Illustrative only.
```
$ go test ./money -run TestAllocateSums -v -rapid.checks=1000
=== RUN   TestAllocateSums
    money_property_test.go:14: [rapid] OK, passed 1000 tests (8.1ms)
--- PASS: TestAllocateSums (0.01s)
$ go test ./money -run '^$' -fuzz FuzzParse -fuzztime 60s
fuzz: elapsed: 0s, gathering baseline coverage: 0/3 completed
fuzz: elapsed: 60s, execs: 2214567 (36906/sec), new interesting: 41 (total: 44)
PASS
```
The check count and fuzz time above are the user's chosen inputs.

---

## Exit Criteria

DONE when rapid properties, the fuzz target and the database state machine pass, failing cases are kept as regressions, and nothing was skipped or narrowed to pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Fuzz finds a panic in `Parse` | **Stop**: fix `Parse` to return an error; keep the corpus file. |
| Phase 2 | `LEDGER_TEST_DSN` unset | **Return**: ask for a test database; never point at production. |
| Phase 2 | Property fails | **Stop**: rerun to replay the saved fail file, fix the code; never delete the property. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
