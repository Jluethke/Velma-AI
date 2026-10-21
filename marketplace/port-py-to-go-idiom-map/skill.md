# Port Python to Go Idiom Map

**One-line description:** Produces the project-specific Python to Go translation table (exceptions to error returns, None to pointers or comma-ok, dict and set to maps with sorted iteration, list aliasing through `append`, classes to structs and interfaces, generators to `iter.Seq`, `with` to `defer`, keyword arguments to option structs, stable sorting) plus the `go vet` and `staticcheck` checks that catch the common translation bugs, filled in only for constructs the source uses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the Python repository at the reference commit.
- `dependency_map` (object[], required): Output of `port-dependency-equivalence-map`.
- `integer_findings` (object[], required): Output of `port-integer-semantics-audit`; decides `int64` versus `math/big`.

---

## Outputs

- `py_go_idioms` (object): `go_version` (from `go.mod`), `rules` (one row per construct used: Python form, Go form, trap, example source location), `layout` (package and directory plan), and `checks` (commands run after every ported file).

---

## Phase 1: Fix the Go Baseline

### Entry Criteria
- Target module exists or will be created with `go mod init <module path>`.

### Actions
1. Read the `go` directive in `go.mod` and `go version`. Several rules below depend on it:
   - Go 1.21: `min`, `max`, `clear` built-ins; `slices`, `maps`, `log/slog` packages.
   - Go 1.22: each loop iteration has its own loop variable (closures capturing `i` no longer share it); `for i := range n` over an integer.
   - Go 1.23: range-over-func iterators (`iter.Seq`, `iter.Seq2`); `slices.Sorted(maps.Keys(m))`.
2. Plan the layout: one Go package per Python package (directory), never one package per Python module file. Unexported names start lowercase; exported start uppercase. Put non-public code under `internal/`.
3. Count source constructs as in the Python to TypeScript flow (truthiness, comprehensions, dataclasses, `with`, default args, slicing, sorting, dict and set, async, exceptions) with `rg -n ... --type py | wc -l`; keep only nonzero ones.

### Output
`go_version`, `layout`, construct counts.

### Quality Gate
- `go version` output and the `go.mod` `go` line are recorded.
- Every Python package maps to exactly one Go package path.

---

## Phase 2: Fill the Translation Table

### Entry Criteria
- Baseline fixed.

### Actions
1. Copy rows with nonzero counts into `rules`, each with one real source location.

| Python | Go | Trap |
|---|---|---|
| `raise ValueError(m)` / `try: except` | `return zero, fmt.Errorf("...: %w", ErrX)`; caller `if err != nil { return ..., err }` | an ignored error compiles if assigned to `_`; `errcheck` or `staticcheck` reports unchecked errors |
| `None` for "no value" | `(T, bool)` comma-ok, or `*T` | returning a typed nil pointer inside an `error` interface makes `err != nil` true |
| `d[k]` (KeyError on miss) | `v, ok := m[k]; if !ok { ... }` | `m[k]` returns the zero value silently |
| `d = {}` then `d[k] = v` | `m := map[K]V{}` or `make(map[K]V)` | writing to a nil map (`var m map[K]V`) panics |
| iterate `dict` (insertion order) | `for _, k := range keys` with `keys` kept in a slice beside the map, or sorted with `slices.Sorted(maps.Keys(m))` | Go map iteration order is randomized on purpose |
| `set[T]` | `map[T]struct{}` | no built-in set operations; write `union`/`intersect` helpers once |
| `list` | slice `[]T` | `b := a[:2]; b = append(b, x)` can overwrite `a[2]`: slices share the backing array; use `slices.Clone` before mutating a slice you did not create |
| `list.copy()` / `a[:]` | `slices.Clone(a)` | `a[:]` in Go is the same backing array, not a copy |
| `class` with methods | `struct` plus methods with pointer receivers `func (c *C) M()` | mixing value and pointer receivers makes some methods missing from the interface's method set |
| inheritance | embedding plus interfaces | an embedded type's method calling another method does not dispatch to the outer type's override (no virtual dispatch) |
| `@dataclass` equality | `==` on comparable structs, or a written `Equal` | structs containing slices or maps are not comparable; `==` is a compile error |
| `__str__` / `__repr__` | `String() string` method (fmt uses it for `%v`) | defining `String` on a pointer receiver means `fmt.Println(v)` of a value does not use it |
| `Enum` | `type Color int` with `const ( Red Color = iota ... )` and a `String()` method | iota values start at 0; Python `auto()` starts at 1 |
| generator / `yield` | `iter.Seq[T]` (Go 1.23+): `func(yield func(T) bool)` | must stop when `yield` returns false; channels plus goroutines leak if the consumer stops early |
| `with x as y:` | `y, err := open(); if err != nil {...}; defer y.Close()` | `defer` runs at function return, not end of block; inside a loop, move the body into a function |
| default args / kwargs | option struct `type Opts struct{...}` with zero values meaning default, or functional options | zero value must be a valid default; if 0 is a meaningful input, use `*int` |
| `isinstance` | type switch `switch v := x.(type)` | avoid `any` parameters unless the Python code was truly dynamic |
| comprehension | `for` loop appending to a pre-sized slice `make([]T, 0, len(xs))` | none, but keep the order of side effects |
| `sorted(xs, key=k)` | `slices.SortStableFunc(xs, func(a, b T) int { return cmp.Compare(k(a), k(b)) })` | `slices.SortFunc` and `sort.Slice` are not stable; Python sort is |
| `str` operations | see `unicode_findings` | `len(s)` is bytes |
| `int` | `int64` (or `int` on 64-bit targets) where `integer_findings` proves the bound; `*big.Int` otherwise | overflow wraps silently |
| `float` formatting | see `float_findings` | `fmt.Println(1.0)` prints `1` |
| `datetime` | `time.Time` | layouts use the reference date `2006-01-02T15:04:05Z07:00`; `time.Time` values compare with `Equal`, not `==` (monotonic clock and location differ) |
| `json.dumps(obj)` | `json.Marshal` with struct tags `json:"name"` | unexported fields are skipped silently; `omitempty` drops zero values Python would keep |
| `async`/`await`, threads | see `concurrency_mapping` | |
| module-level mutable globals | fields on a struct passed explicitly | package-level vars are shared by all goroutines |

2. Set `checks`, run after each ported file:
```
gofmt -l .            # must print nothing
go vet ./...          # copylocks, printf, loopclosure, unusedresult and more
staticcheck ./...     # install: go install honnef.co/go/tools/cmd/staticcheck@latest
go test ./... -count=1
```

### Output
`py_go_idioms`.

### Quality Gate
- Every nonzero construct has a row with a real source location.
- `gofmt -l .`, `go vet ./...` and `staticcheck ./...` run cleanly on an empty package in the target module (proves the tools are installed).

---

## Phase 3: Prove Three Rules on Real Code

### Entry Criteria
- Table filled.

### Actions
1. Pick the three rules with the highest counts. Port each example function twice into a scratch package: once following the rule, once naively.
2. Run the golden records for that function's behavior against both with a small table-driven test. Record pass and fail counts. The rule version must pass all.

### Output
Evidence per rule.

### Quality Gate
- For each of the three rules, both versions' pass and fail counts are recorded, and the rule version has zero failures.

---

## Worked Example

Illustrative. Source:
```python
def tags_for(posts: list[dict]) -> list[str]:
    seen = {}
    for p in posts:
        for t in p.get("tags", []):
            seen[t] = seen.get(t, 0) + 1
    return [t for t, n in seen.items() if n > 1]
```
Naive Go returns `for t, n := range seen` results: order changes run to run. Golden replay of B-009 (24 records): naive 9 pass, 15 fail with different order on each run; `go test -count=3` shows different failures each time.

Rule-based Go keeps insertion order with a `keys []string` slice appended on first sight, matching Python dict order: 24 pass on `go test -count=3`.
```
$ go vet ./... && staticcheck ./...
$ go test ./tags -run TestGolden -count=3
ok  	example.com/blog/tags	0.031s
```

---

## Exit Criteria

DONE when the Go version is fixed, every construct the source uses has a rule with a real example, the check commands run, and the top three rules are proven against golden records.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `go.mod` declares a version below 1.22 | **Adjust**: raise it if the user allows; otherwise add the loop variable capture trap (`v := v` inside the loop) and drop rules that need newer versions. |
| Phase 2 | Python code is duck-typed across unrelated classes | **Adjust**: define a small interface with exactly the methods called; do not use `any` plus reflection. |
| Phase 3 | `staticcheck` not installable (offline) | **Adjust**: use `go vet` only and record the gap. |
| Phase 3 | Rule version fails a record | **Stop**: fix the rule before porting with it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
