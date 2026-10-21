# Regression Test From Each Crash

**One-line description:** Turns every crash cluster's representative input and every property counterexample into a committed regression test in the stack's native form (`@example`, fast-check `examples`, `proptest-regressions` plus a named unit test, `testdata/fuzz` files, Jazzer `Inputs` files, a ctest replay of libFuzzer inputs), and proves red then green: the test fails on the unfixed code and passes after the fix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `crash_clusters` (object[], optional): From `pft-crash-triage-dedup`.
- `property_failures` (object[], optional): From `pft-shrinking-reproduction`.
- `stack` (string, required): Selects the regression form.
- `repo_path` (string, required): Project root.

---

## Outputs

- `regression_tests` (object[]): One row per cluster or failure: test file and name, committed input file (if any), command that runs it in the normal test suite.
- `fix_verification` (object[]): One row per test: red run output on the unfixed commit, fix commit or diff reference, green run output, and full-suite result.

---

## Phase 1: Write the Regression Test (Red)

### Entry Criteria
- At least one cluster or property failure exists.
- The target is still unfixed in the working tree (`git stash list` and `git diff` show no fix applied).

### Actions
1. Write one test per cluster or failure, using the form for the stack:

| `stack` | Property counterexample | Fuzz crash input |
|---|---|---|
| python | add `@example(<shrunk args>)` to the failing `@given` test, plus a plain test that calls the target with the same value | copy the input to `tests/fuzz_regressions/<cluster>.bin`; a pytest test reads it with `Path(...).read_bytes()` and calls `TestOneInput` or the target directly |
| node | add `examples: [[<counterexample>]]` to the `fc.assert` options (or `test.prop(..., { examples })`) | copy to `test/fuzz_regressions/` and read with `fs.readFileSync` |
| rust | commit the `proptest-regressions/<module>.txt` line and add a named `#[test]` with the minimal value | copy to `tests/fuzz_regressions/<cluster>.bin`; `#[test] fn crash_<cluster>() { let d = include_bytes!("fuzz_regressions/<cluster>.bin"); let _ = decode(d); }` |
| go | add a plain `TestXxx` with the shrunk values (rapid fail files may also be committed under `testdata/rapid/`) | commit `testdata/fuzz/<FuzzName>/<hash>`; plain `go test ./<pkg>` runs it |
| haskell | `testCase "P5 regression" $ assertBool "" (prop_P5_roundtrip [Field "\""])` or `once` with the value | n/a |
| jvm | jqwik `@Example` method with the sample; JUnit `@Test` otherwise | keep the `crash-<sha1>` file under `src/test/resources/<pkg>/<Class>Inputs/<method>/`; plain `mvn test` replays it |
| cpp | GoogleTest or ctest case calling the target with the bytes | copy to `fuzz/regressions/<cluster>/`; add `add_test(NAME png_fuzz_regressions COMMAND png_fuzzer ${CMAKE_SOURCE_DIR}/fuzz/regressions/png/<file> ...)` listing the files (libFuzzer runs file arguments once each and exits), or link the harness with LLVM's `StandaloneFuzzTargetMain.c` for a non-fuzz build |

2. Name each test after the cluster key or property id so failures map back.
3. The test must assert the correct behavior (expected error class or correct output), not just "does not crash", whenever the contract defines the correct behavior.
4. Run the new test on the unfixed code. It must fail with the same error as the cluster or counterexample. Save that output as the red run.

### Output
Red regression tests.

### Quality Gate
- Each new test fails on the unfixed code with the cluster's first error line or the property's assertion message (saved output).

---

## Phase 2: Fix and Go Green

### Entry Criteria
- All new tests are red for the expected reason.

### Actions
1. Fix one cluster at a time, starting from the highest severity class. Edit only the file named by the cluster's first project frame unless the root cause is clearly upstream of it; record why if you edit another file.
2. Run the single regression test until it passes. Then run the full suite.
3. Do not edit, weaken, skip or delete the regression test or any other test to get green. Do not add a broad `catch`, `recover` or `except` around the call. Do not cap input size in the target unless the format documents that cap.
4. Rerun the fuzz target on its corpus once with no mutation (`-runs=0` for libFuzzer-based tools, `go test -run=<FuzzName>` for Go, regression mode for Jazzer) to confirm the corpus is clean.
5. Commit the fix together with its regression test and input file.

### Output
Fixed code with green regression tests.

### Quality Gate
- The single test passes; the full suite command for the stack exits 0.
- `git diff --stat` for the commit shows no deleted or modified pre-existing test lines except added `@example` or `examples` entries (check with `git diff -U0 -- tests test src/test | grep '^-[^-]'` printing nothing).

---

## Phase 3: Prove the Test Guards the Fix

### Entry Criteria
- Fix committed.

### Actions
1. Revert only the fix in the working tree (`git revert --no-commit <fix commit>` and then restore the test files from HEAD, or `git stash` a reverse patch of the source files only).
2. Run the regression test. It must fail again with the same error.
3. Restore the fix (`git revert --abort` or `git checkout -- <files>`) and run the test once more; it must pass.
4. Record red, green and re-red outputs in `fix_verification`.

### Output
`regression_tests`, `fix_verification`.

### Quality Gate
- Each `fix_verification` row has three saved outputs: red on unfixed code, green with the fix, red again with the fix reverted.
- `git status` is clean after restoring the fix.

---

## Worked Example

Illustrative. `stack` = `go`, cluster `go-assert | Marshal | ParseHeader` from `testdata/fuzz/FuzzParseHeader/582528ddfad69eb5`.

```text
$ git add internal/hdr/testdata/fuzz/FuzzParseHeader/582528ddfad69eb5
$ go test ./internal/hdr                       # red
--- FAIL: FuzzParseHeader/582528ddfad69eb5 (0.00s)
    hdr_fuzz_test.go:17: round-trip mismatch: "A:\x00" -> "A: \x00\r\n" (<nil>)
# fix: ParseHeader rejects control bytes in values with ErrMalformed (RFC 9110 section 5.5)
$ go test ./internal/hdr                       # green
ok      example.com/svc/internal/hdr  0.015s
$ git stash push internal/hdr/parse.go && go test ./internal/hdr   # re-red, same message
$ git stash pop && go test ./...               # green, full suite
```

`regression_tests`: the committed testdata file runs in plain `go test`. `fix_verification`: red, green, re-red outputs recorded.

---

## Exit Criteria

DONE when every cluster and property failure has a committed regression test in the stack's native form that was red before the fix, green after, red again with the fix reverted, and the full suite passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | New test passes on unfixed code | **Adjust**: the input or call path differs from the crash; reproduce with the cluster's command and copy its exact input and call. |
| Phase 2 | Fix makes another test fail | **Adjust**: the fix changed documented behavior; revisit it; never edit the other test to match. |
| Phase 2 | Root cause is in a dependency | **Return**: pin or patch per project policy, report upstream, and keep the regression test. |
| Phase 3 | Test stays green with the fix reverted | **Adjust**: the test does not exercise the bug; rewrite it until re-red holds. |
| Phase 3 | Revert conflicts | **Retry**: revert only the source hunks by hand from `git show <fix commit> -- <source files>`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
