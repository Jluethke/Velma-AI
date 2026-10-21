# Go Recursive-Descent Parser from ABNF

**One-line description:** Hand-writes a Go recursive-descent parser with one function per ABNF rule over a `[]byte` cursor, handles ABNF's unordered alternation by explicit backtracking, and proves it with table-driven tests from the spec examples plus a native `go test -fuzz` target that checks the parser never panics.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `grammar_file` (string, required): From `s2i-abnf-extract-validate`.
- `start_rule` (string, required): The ABNF rule a complete input must match.
- `project_dir` (string, required): Go module root containing `go.mod` (Go 1.18 or later for native fuzzing).

---

## Outputs

- `parser_module` (string): Path to the package, for example `internal/grammar/`.
- `parser_tests` (string): Path to `internal/grammar/grammar_test.go`.

---

## Phase 1: Map Rules to Functions

### Entry Criteria
- `grammar_file` passed its validators.
- `go version` prints 1.18 or later.

### Actions
1. Create `internal/grammar/grammar.go` with a cursor type:
   ```go
   type p struct{ in []byte; pos int }
   ```
   Every rule function has the signature `func (s *p) ruleName() bool` and must restore `s.pos` to its starting value when it returns false. Write that restore in every function: `start := s.pos; ...; s.pos = start; return false`.
2. Write rules bottom-up: RFC 5234 core rules first (`isALPHA(b byte) bool`, `isDIGIT`, `isHEXDIG`), then rules that only use core rules, then the rest. One rule per commit-sized step; run `go build ./...` after each.
3. Translate constructs:

   | ABNF | Go |
   |---|---|
   | `a b` | `if !s.a() { s.pos = start; return false }; if !s.b() { s.pos = start; return false }` |
   | `a / b` | try each alternative from `start`; see step 4 |
   | `*a` | `for s.a() {}` |
   | `1*a` | `if !s.a() {...fail}; for s.a() {}` |
   | `n*m a` | counted loop with `count` and the bounds from the grammar |
   | `"abc"` (case-insensitive) | `bytes.EqualFold(s.in[s.pos:s.pos+3], []byte("abc"))` after a length check |
   | `%s"abc"` | `bytes.HasPrefix(s.in[s.pos:], []byte("abc"))` |
   | `%x30-39` | range check on one byte |

4. Alternation: ABNF accepts any alternative that lets the whole input match. When alternatives can share a prefix, a first-match parser can pick the wrong one. For each alternation, write a comment listing whether alternatives can share a prefix. If they can, implement it as longest-match: try every alternative from `start`, keep the one with the greatest `s.pos`, and if the outer rule later fails, return to the next candidate. Do not assume first-match is safe without the comment.
5. Export `func Parse(in []byte) error` that runs the start rule and returns `&SyntaxError{Offset: s.pos}` unless the rule succeeds and `s.pos == len(in)`.

### Output
`internal/grammar/grammar.go`.

### Quality Gate
- `go build ./...` and `go vet ./internal/grammar/` exit 0.
- Number of rule functions equals the number of ABNF rules (`grep -c '^func (s \*p)' internal/grammar/grammar.go`).

---

## Phase 2: Table-Driven Spec Tests

### Entry Criteria
- Package builds.

### Actions
1. In `grammar_test.go` write `func TestParse(t *testing.T)` with a slice of `{name string; in string; ok bool}` and a `t.Run(tc.name, ...)` loop.
2. Add every spec example for the start rule as `ok: true`, named `<section>/<short name>`.
3. Add negative cases: a forbidden byte, a missing required element, a trailing extra byte, an empty input (unless the start rule allows empty).
4. Run `go test ./internal/grammar/ -run TestParse -v`. Fix one failing case at a time and rerun.
5. Never flip `ok` on a spec example to get green; a real spec conflict goes to the ambiguity log and the case gets `t.Skip("AMB-nnn")`.

### Output
`parser_tests`.

### Quality Gate
- `go test ./internal/grammar/ -run TestParse -v` exits 0 and prints `--- PASS` for every case.
- Count of `ok: true` cases is at least the number of spec examples.

---

## Phase 3: Fuzz for Panics

### Entry Criteria
- Table tests pass.

### Actions
1. Add `func FuzzParse(f *testing.F)` that seeds `f.Add` with every table case and calls `Parse(data)` in `f.Fuzz(func(t *testing.T, data []byte) { _ = Parse(data) })`. The property is: no panic, no index-out-of-range.
2. Run for a duration the user chooses: `go test ./internal/grammar/ -run '^$' -fuzz '^FuzzParse$' -fuzztime <duration>`. `-fuzz` accepts only one target per package run.
3. If a failure is found, Go writes the input to `testdata/fuzz/FuzzParse/<hash>`. Keep that file; it becomes a permanent regression case run by plain `go test`.
4. Fix the bounds check, then rerun `go test ./internal/grammar/` (which replays `testdata/fuzz`) before fuzzing again.

### Output
Fuzz run record.

### Quality Gate
- The fuzz command ends with `PASS` or a saved crasher that is then fixed and replayed green.
- `ls internal/grammar/testdata/fuzz/FuzzParse/` contents are committed when any exist.

---

## Worked Example

Illustrative. RFC 7230-style `token` and RFC 9110 `field-name`, `start_rule` = `field-name`.

Phase 1: `tchar` becomes a byte-set function; `token = 1*tchar` becomes `func (s *p) token() bool { start := s.pos; for s.pos < len(s.in) && isTchar(s.in[s.pos]) { s.pos++ }; return s.pos > start }`.

Phase 2:
```
$ go test ./internal/grammar/ -run TestParse -v
=== RUN   TestParse/5.1/Content-Type
--- PASS: TestParse/5.1/Content-Type (0.00s)
=== RUN   TestParse/neg/space-in-name
--- PASS: TestParse/neg/space-in-name (0.00s)
ok   example.com/h/internal/grammar  0.012s
```
Phase 3:
```
$ go test ./internal/grammar/ -run '^$' -fuzz '^FuzzParse$' -fuzztime 60s
fuzz: elapsed: 60s, execs: ... , new interesting: ...
PASS
```
(`60s` here is the user's chosen budget for this example.)

---

## Exit Criteria

DONE when one Go function exists per ABNF rule, every alternation's prefix overlap is documented and handled, table tests from spec examples pass, and fuzzing finds no panic or any found crasher is fixed and kept as a regression seed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Left-recursive ABNF rule | **Adjust**: rewrite as iteration; recursive descent would recurse forever. |
| Phase 1 | Deep nesting rule (for example nested comments) | **Adjust**: add a depth counter with a limit taken from the spec or a user input, never an invented number. |
| Phase 2 | Valid example fails only on an alternation | **Adjust**: switch that alternation to longest-match per Phase 1 step 4. |
| Phase 3 | `-fuzz` flag not recognized | **Stop**: Go is older than 1.18; upgrade or skip fuzzing and say so. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
