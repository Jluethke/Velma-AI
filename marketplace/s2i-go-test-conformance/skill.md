# Go Conformance Suite with go test

**One-line description:** Implements the conformance test plan as table-driven Go tests with requirement IDs in subtest names, loads vectors from `testdata/vectors.json` with `embed`, and converts `go test -json` output to `reports/conformance-junit.xml` with `gotestsum` for the traceability matrix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `conformance_test_plan` (object[], required): From `s2i-conformance-test-design`.
- `test_vectors` (object, required): From `s2i-test-vectors-extract`.
- `project_dir` (string, required): Go module root.

---

## Outputs

- `conformance_tests` (string): Path to `conformance/` package (tests only).
- `junit_report` (string): Path to `reports/conformance-junit.xml`.

---

## Phase 1: Package and Vector Loading

### Entry Criteria
- `go version` works; `testdata/vectors.json` exists.

### Actions
1. Create the package `conformance/` with `doc.go` (`package conformance`) and `vectors_test.go`.
2. Copy or symlink is not allowed by `embed` outside the package directory, so place a copy at `conformance/testdata/vectors.json` and keep it in sync with a `go generate` line or a Makefile `cp`. Then:
   ```go
   //go:embed testdata/vectors.json
   var vectorsJSON []byte
   ```
   Note: `go test` sets the working directory to the package directory, so `os.ReadFile("testdata/vectors.json")` also works without embed.
3. Define `type Vector struct { ID string; ReqIDs []string \`json:"req_ids"\`; Input, Expected, Encoding string }` and `func vectors(t *testing.T, prefix string) []Vector`.

### Output
Loadable vectors.

### Quality Gate
- `go vet ./conformance/` exits 0.
- A temporary `TestLoad` printing `len(vectors(t,""))` matches the vector count in the JSON; delete it after checking.

---

## Phase 2: Write Tests from the Plan

### Entry Criteria
- Vectors load.

### Actions
1. One file per spec section: `conformance/sec_5_1_test.go`. Finish and run one file before starting another.
2. One top-level test per section, subtests per plan row. Subtest name = `<test_id>/<req ids joined by +>`:
   `t.Run("T-5.1-02-01/REQ-5.1-02", func(t *testing.T) { ... })`.
   `go test` replaces spaces in subtest names with `_`, so avoid spaces; the IDs survive unchanged.
3. Start the server under test with `ln, _ := net.Listen("tcp", "127.0.0.1:0")` and pass `ln` to it; read the port from `ln.Addr()`. For HTTP-based protocols, `httptest.NewServer` does this for you.
4. Set deadlines on every connection: `conn.SetDeadline(time.Now().Add(timeout))` with `timeout` from the spec or a test flag the user sets; never block forever.
5. Compare bytes with `bytes.Equal` and print hex on failure: `t.Fatalf("got %x want %x", got, want)`.
6. Use `t.Parallel()` only for tests that start their own server.
7. Never use `t.Skip` to hide an implementation failure. `t.Skip` is allowed only with an `AMB-` or a documented "not implemented MAY" reason.

### Output
`conformance_tests`.

### Quality Gate
- `go test ./conformance/ -list '.*'` lists every top-level test.
- `grep -ohE 'T-[0-9A-Za-z.-]+' conformance/*_test.go | sort -u` matches the plan's `test_id` list.

---

## Phase 3: Run and Report

### Entry Criteria
- Tests written.

### Actions
1. Install the converter: `go install gotest.tools/gotestsum@latest`.
2. Run: `mkdir -p reports && gotestsum --junitfile reports/conformance-junit.xml --format testname -- ./conformance/ -count=1 -race`.
   `-count=1` disables the test cache so results are fresh; `-race` turns on the race detector (needs cgo on some platforms; drop it only if the platform lacks support and record that).
3. Read the final line: `DONE N tests, M failures`.
4. Rerun one subtest while fixing: `go test ./conformance/ -run 'TestSec5_1/T-5.1-02-01' -v -count=1`. Note `-run` splits on `/` and each part is a regex, so `.` matches any character; that is acceptable here.

### Output
`junit_report`.

### Quality Gate
- `reports/conformance-junit.xml` exists; `grep -c 'REQ-' reports/conformance-junit.xml` is greater than zero.
- The `DONE` line is copied into the run notes as printed.

---

## Worked Example

Illustrative. RFC 6455 server package.

Phase 2:
```go
func TestSec5_1(t *testing.T) {
    t.Run("T-5.1-02-01/REQ-5.1-02", func(t *testing.T) {
        c := dialAndHandshake(t, addr)
        c.Write([]byte{0x81, 0x05, 'H', 'e', 'l', 'l', 'o'}) // unmasked
        got := readAll(t, c)
        if len(got) != 0 && !(got[0] == 0x88 && binary.BigEndian.Uint16(got[2:4]) == 1002) {
            t.Fatalf("got %x", got)
        }
    })
}
```
Phase 3:
```
$ gotestsum --junitfile reports/conformance-junit.xml --format testname -- ./conformance/ -count=1 -race
PASS conformance.TestSec5_1/T-5.1-02-01/REQ-5.1-02 (0.00s)
...
DONE 63 tests in 1.84s
```

---

## Exit Criteria

DONE when every plan row is a Go subtest whose name carries its requirement IDs, the run uses `-count=1`, and the JUnit file is written by `gotestsum`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `pattern testdata/vectors.json: no matching files` | **Adjust**: the embed path is relative to the package; copy the file into `conformance/testdata/`. |
| Phase 2 | Test hangs | **Adjust**: a deadline is missing on a `net.Conn`; add it. |
| Phase 3 | `-race` unsupported | **Adjust**: rerun without it and record the platform. |
| Phase 3 | `gotestsum` not on PATH | **Adjust**: add `$(go env GOPATH)/bin` to PATH. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
