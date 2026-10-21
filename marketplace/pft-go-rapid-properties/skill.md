# Go Property Tests with rapid

**One-line description:** Writes Go property tests with `pgregory.net/rapid` (generators drawn inside `rapid.Check`, state machines with `t.Repeat`), reads rapid's shrunk failure output, and replays failures with the `-rapid.failfile` and `-rapid.seed` flags.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `property_catalog` (object[], required): Rows from `pft-invariant-discovery`, including any `model` row.
- `repo_path` (string, required): Module root containing `go.mod`.

---

## Outputs

- `go_property_tests` (object[]): One row per test: catalog `id`, file, test name, generators, whether it is a `t.Repeat` state machine, the mutation used, and the fail file path rapid wrote for it.

---

## Phase 1: Add rapid and Pick Generators

### Entry Criteria
- `go test ./...` passes before changes.

### Actions
1. `go get pgregory.net/rapid@latest` then `go mod tidy`. Confirm `grep rapid go.mod`.
2. Map each domain with this table; verify any other generator on pkg.go.dev for `pgregory.net/rapid` before using it.

| Domain | Generator |
|---|---|
| Integer, bounded integer | `rapid.Int()`, `rapid.IntRange(a, b)`, `rapid.Uint64()` |
| String, regex string | `rapid.String()`, `rapid.StringMatching("[a-z]{1,8}")` (bounds from the catalog) |
| Bytes | `rapid.SliceOf(rapid.Byte())` |
| Slice with size bounds | `rapid.SliceOfN(elem, minLen, maxLen)` (`-1` for no max) |
| Distinct slice | `rapid.SliceOfDistinct(elem, keyFn)` |
| Map | `rapid.MapOf(k, v)` |
| Fixed choices | `rapid.SampledFrom([]T{...})`, `rapid.Just(x)` |
| Union | `rapid.OneOf(a, b)` |
| Struct | `rapid.Custom(func(t *rapid.T) Order { return Order{ID: rapid.Int().Draw(t, "id")} })` |
| Transform or reject | `rapid.Map(gen, f)`, `gen.Filter(pred)` (filter sparingly) |

3. Every `Draw` takes a label as its second argument; use the parameter name so failures are readable.

### Output
Generator per catalog row.

### Quality Gate
- `go build ./...` and `go vet ./...` pass after adding the import.

---

## Phase 2: Write Property and State Machine Tests

### Entry Criteria
- Generators chosen.

### Actions
1. Create `<pkg>_prop_test.go` in the same package. One test at a time; run after each.

```go
func TestP1Roundtrip(t *testing.T) {
    rapid.Check(t, func(t *rapid.T) {
        n := rapid.Uint64().Draw(t, "n")
        b := Encode(n)
        got, k, err := Decode(b)
        if err != nil || got != n || k != len(b) {
            t.Fatalf("Decode(Encode(%d)) = %d, %d, %v", n, got, k, err)
        }
    })
}
```

2. Inside `rapid.Check`, use the `*rapid.T` (the inner `t`), never the outer `*testing.T`. Calling the outer one breaks shrinking.
3. For a `model` row, write a state machine with `t.Repeat`. Keys are action names; the empty-string key is run after every action as the invariant check:

```go
func TestQueueModel(t *testing.T) {
    rapid.Check(t, func(t *rapid.T) {
        q := NewQueue()
        var model []int
        t.Repeat(map[string]func(*rapid.T){
            "push": func(t *rapid.T) {
                v := rapid.Int().Draw(t, "v")
                q.Push(v); model = append(model, v)
            },
            "pop": func(t *rapid.T) {
                if len(model) == 0 { t.Skip("empty") }
                got := q.Pop(); want := model[0]; model = model[1:]
                if got != want { t.Fatalf("pop = %d, want %d", got, want) }
            },
            "": func(t *rapid.T) {
                if q.Len() != len(model) { t.Fatalf("len %d != %d", q.Len(), len(model)) }
            },
        })
    })
}
```

`t.Skip` inside an action skips that action, not the whole test.
4. Run `go test -run 'TestP1Roundtrip|TestQueueModel' -v ./<pkg>`. Run counts default to `-rapid.checks=100`; change only with a user-provided value.

### Output
Passing rapid tests.

### Quality Gate
- `go test ./<pkg>` exits 0.
- No outer `*testing.T` is referenced inside any `rapid.Check` closure (read each closure).

---

## Phase 3: Mutation-Check and Replay

### Entry Criteria
- Tests pass.

### Actions
1. Inject one temporary bug per test. Run the test. rapid prints the drawn values with labels and a fail file line:

```text
--- FAIL: TestQueueModel (0.01s)
    queue_prop_test.go:24: [rapid] failed after 7 tests: pop = 2, want 1
        To reproduce, specify -run="TestQueueModel" -rapid.failfile="testdata/rapid/TestQueueModel/TestQueueModel-20261020101500-1234.fail"
        Failed test output:
    queue_prop_test.go:16: [rapid] draw action: "push"
    queue_prop_test.go:17: [rapid] draw v: 1
    ...
```

2. Replay exactly with the printed command. It must fail the same way.
3. Revert the bug (`git checkout -- <file>`), delete the fail file the mutant produced, rerun green.
4. For real bugs, keep the fail file and record it for `pft-shrinking-reproduction`.

### Output
`go_property_tests`.

### Quality Gate
- Every test has a recorded mutation and a fail file replay that failed.
- `git status --short testdata/rapid` shows no mutant fail files.

---

## Worked Example

Illustrative. Row P2: `Normalize(Normalize(s)) == Normalize(s)` for header names.

```go
func TestP2NormalizeIdempotent(t *testing.T) {
    rapid.Check(t, func(t *rapid.T) {
        s := rapid.StringMatching(`[A-Za-z0-9-]{0,20}`).Draw(t, "s")
        once := Normalize(s)
        if twice := Normalize(once); twice != once {
            t.Fatalf("Normalize(%q)=%q, again=%q", s, once, twice)
        }
    })
}
```

Mutation: uppercase only the first rune after a dash.

```text
$ go test -run TestP2NormalizeIdempotent ./header
[rapid] failed after 12 tests: Normalize("a-b")="a-B", again="A-B"
To reproduce, specify -run="TestP2NormalizeIdempotent" -rapid.failfile="testdata/rapid/TestP2NormalizeIdempotent/....fail"
$ git checkout -- header/normalize.go && rm -r testdata/rapid/TestP2NormalizeIdempotent
$ go test -run TestP2NormalizeIdempotent ./header
ok      example.com/svc/header  0.041s
```

---

## Exit Criteria

DONE when each Go catalog row has a passing rapid test (state machines via `t.Repeat` for model rows), each was killed by a mutation whose fail file replayed, and no mutant artifacts remain.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Go version older than rapid requires | **Stop**: report the `go` directive in `go.mod` and the rapid requirement from its go.mod. |
| Phase 2 | `[rapid] failed to generate` or too many filtered values | **Adjust**: replace `Filter` with a constructive generator or `rapid.Custom`. |
| Phase 2 | Real failure on the unmodified code | **Return**: keep the fail file and send it to `pft-shrinking-reproduction`. |
| Phase 3 | Replay does not fail | **Adjust**: the code reads time or global random state; inject it and rerun. |
| Phase 3 | Mutation not detected | **Adjust**: add an assertion on the changed observable. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
