# Go Testable Examples With // Output Comments

**One-line description:** Writes Go documentation samples as `Example` functions in `_test.go` files with `// Output:` or `// Unordered output:` comments so `go test` executes and checks them, names each one so godoc attaches it to the right identifier, and confirms every example both runs and renders.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the module root.
- `docstring_report` (object[], required): Result of `dfc-go-doc-comments`; lists the exported identifiers per package.

---

## Outputs

- `sample_test_command` (string): The command CI runs: `go test -run '^Example' ./...`.
- `sample_test_report` (object[]): Per example: function name, attached identifier, has output comment (yes/no), result, fix.

---

## Phase 1: Plan Which Identifiers Get Examples

### Entry Criteria
- `go test ./...` passes before changes.

### Actions
1. List existing examples: `grep -rn -E '^func Example' --include='*_test.go' .`.
2. For each package, pick identifiers to cover in this order: the package itself (`Example`), constructors (`NewX`), the main type's most-used methods, then functions mentioned in the README.
3. Name each function with the godoc rule:

   | Documents | Function name |
   |---|---|
   | The package | `Example` |
   | Function `F` | `ExampleF` |
   | Type `T` | `ExampleT` |
   | Method `T.M` | `ExampleT_M` |
   | A second example of the same item | Add a suffix starting with a lowercase letter: `ExampleT_M_withTimeout` |

4. Do NOT name an example after an identifier that does not exist; `go vet` reports it and godoc will not show it.

### Output
Example plan per package.

### Quality Gate
- Every planned name maps to an identifier present in `go doc -short <import/path>` output.

---

## Phase 2: Write the Examples

### Entry Criteria
- Plan exists.

### Actions
1. Put examples in `example_test.go` in the external test package `<pkg>_test`, so the example uses the package exactly as a user does (qualified names, exported API only):
   ```go
   package ratelimit_test

   import (
       "fmt"
       "time"

       "github.com/acme/ratelimit"
   )

   func ExampleLimiter_Allow() {
       l := ratelimit.NewLimiter(2, time.Second)
       fmt.Println(l.Allow(), l.Allow(), l.Allow())
       // Output: true true false
   }
   ```
2. Output comment rules:

   | Output property | Comment |
   |---|---|
   | Deterministic, ordered | `// Output:` followed by the exact lines |
   | Deterministic set, order varies (map iteration, goroutines) | `// Unordered output:` |
   | Depends on time, network, randomness | Make it deterministic (fixed seed, injected clock, `httptest.Server`); if impossible, omit the output comment, which means the example is compiled but NOT run, and record that in `sample_test_report` |

3. Comparison ignores leading and trailing space on the whole output, but not differences inside lines. Copy expected output from a real run, never type it from memory: temporarily write `// Output:` with nothing after it, run `go test -run '^ExampleLimiter_Allow$' ./ratelimit/`, and copy the `got:` block from the failure.
4. Write one example, run it, then write the next. Do NOT write all examples and run once.
5. For an example that needs helper types or several functions, use a whole-file example: a file containing exactly one `Example` function, its supporting top-level declarations, and no test or benchmark functions; godoc shows the entire file.

### Output
Example files.

### Quality Gate
- `go test -run '^Example' -v ./... 2>&1 | grep -c '^--- PASS: Example'` equals the number of examples that have an output comment.
- `go vet ./...` exits 0.

---

## Phase 3: Confirm Rendering

### Entry Criteria
- Examples pass.

### Actions
1. Run `pkgsite .` (see `dfc-go-pkgsite-reference`) and check each example appears under its identifier with its output.
2. Record every example without an output comment and the reason.
3. Set `sample_test_command` to `go test -run '^Example' ./...`. The full `go test ./...` also runs examples; the narrower command is for fast doc checks.

### Output
`sample_test_command`, `sample_test_report`.

### Quality Gate
- `go test -run '^Example' ./...; echo $?` prints `0` last.
- `sample_test_report` lists every example found by `grep -rn -E '^func Example' --include='*_test.go' .`.

---

## Worked Example

Illustrative only. Phase 2 step 3, empty output first:
```
$ go test -run '^ExampleLimiter_Allow$' ./ratelimit/
--- FAIL: ExampleLimiter_Allow (0.00s)
got:
true true false
want:

FAIL
```
Copy `true true false` into `// Output: true true false`; rerun:
```
$ go test -run '^Example' -v ./ratelimit/
=== RUN   ExampleLimiter_Allow
--- PASS: ExampleLimiter_Allow (0.00s)
PASS
```
A second example lists tenant names from a map; it uses `// Unordered output:` with one name per line.

---

## Exit Criteria

DONE when every planned identifier has a correctly named example in a `_test` package, every deterministic example has an output comment and passes, and each example renders under its identifier.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Package has no exported identifiers | **Skip**: record the package as internal-only; no examples needed. |
| Phase 2 | Example needs unexported helpers | **Adjust**: it is documenting internals; rewrite it against the exported API or move it to an internal test. |
| Phase 2 | Output contains a timestamp | **Adjust**: inject a fixed time through the API if it allows; otherwise print a derived stable value. Never delete the output comment just to make it pass. |
| Phase 3 | Example not shown by pkgsite | **Adjust**: check the name against the Phase 1 table and run `go vet`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
