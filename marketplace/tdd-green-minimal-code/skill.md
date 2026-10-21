# TDD Green: Minimal Code

**One-line description:** Makes the single failing test pass with the least production code, choosing between Kent Beck's Fake It and Obvious Implementation by rule, without touching the test, then proves the whole suite is green.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `failing_test` (object, required): The red test from `tdd-red-one-failing-test`.
- `red_evidence` (object, required): Command, exit code and failure lines proving the red.
- `test_runner` (string, required): One of `pytest`, `unittest`, `jest`, `vitest`, `go-test`, `cargo-test`, `junit5`.

---

## Outputs

- `production_change` (object): Files changed, the diff, the strategy used (fake-it or obvious), and the behavior id.
- `green_evidence` (object): Single-test run and full-suite run commands with exit codes and summary lines.

---

## Phase 1: Choose the Strategy

### Entry Criteria
- `red_evidence` shows an assertion failure (nonzero exit).

### Actions
1. Rerun `failing_test.select_command`. It must still fail the same way. If it now passes or fails differently, stop and go back to red.
2. Pick the strategy:

| Condition | Strategy |
|---|---|
| This is the first test for this function, or you cannot see the general rule yet | Fake It: return the exact expected constant |
| The general rule is one line you are sure of (for example `return a + b`) | Obvious Implementation |
| An earlier test faked a constant and this test needs a different value | Obvious Implementation that satisfies both (this is the triangulation step) |
| Obvious Implementation fails when run | Revert it and Fake It instead |

3. Write down the chosen strategy in `production_change`.

### Output
Strategy recorded.

### Quality Gate
- The rerun reproduces the same failure lines as `red_evidence`.

---

## Phase 2: Write the Minimum

### Entry Criteria
- Strategy chosen.

### Actions
1. Edit ONLY production files. Never edit the test file in this flow. Never edit other tests.
2. Write only enough code for this test. Do not add parameters, branches, error handling, logging or configuration that no test asks for. Extra code has no test and will survive mutation testing later.
3. Keep the change in one file when possible; never more than the files the stub touched plus one.
4. Run `failing_test.select_command`. Expect exit code 0.
5. If it still fails with Fake It, the constant or the wiring is wrong: compare the returned value with the failure line and fix that one thing. If it fails with Obvious Implementation, do not debug the rule: revert (`git restore <production files>`) and switch to Fake It (Beck's fallback rule), then reach the rule through `tdd-triangulate`.

### Output
The target test passes.

### Quality Gate
- `git diff --name-only` lists no test files changed in this flow (compare with the files listed in `failing_test`).
- The single-test command exits 0.

---

## Phase 3: Whole Suite Green

### Entry Criteria
- Target test passes.

### Actions
1. Run the full suite:

| test_runner | Full suite |
|---|---|
| pytest | `python -m pytest -q` |
| unittest | `python -m unittest discover -s tests -t .` |
| jest | `npx jest` |
| vitest | `npx vitest run` |
| go-test | `go test -count=1 ./...` |
| cargo-test | `cargo test` |
| junit5 | `mvn test` or `./gradlew test --rerun` |

2. If any other test broke, the change altered existing behavior. Revert it and choose a narrower change; do not edit the broken test to match.
3. Record both runs in `green_evidence`, including the passed count. The passed count must be the previous count plus one.

### Output
`production_change`, `green_evidence`.

### Quality Gate
- Full suite exit code 0.
- Passed count equals the baseline count from red plus one (read both summary lines).

---

## Worked Example

Illustrative only. `test_runner` = `go-test`, test `TestTotal/one_item` expects `Total([]Item{{Price: 5}}) == 5`; earlier test `TestTotal/empty_cart` expects 0 and was faked with `return 0`.

Phase 1: rerun shows `got 0, want 5`. Earlier fake plus new value means row 3: Obvious Implementation.
Phase 2:

```go
func Total(items []Item) int {
	sum := 0
	for _, it := range items {
		sum += it.Price
	}
	return sum
}
```

Phase 3:

```
$ go test -count=1 ./...
ok  	example.com/cart	0.003s
```

`go test -count=1 -v ./cart | grep -c -- '--- PASS'` goes from 1 to 2.

---

## Exit Criteria

DONE when the target test and the full suite pass, only production files changed, and the passed count rose by exactly one.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Test no longer fails | **Return**: go back to `tdd-red-one-failing-test`; something else changed. |
| Phase 2 | Obvious Implementation still red | **Adjust**: revert and Fake It with the exact expected value. |
| Phase 2 | Test seems wrong | **Stop**: do not edit it here; return to red with a note explaining the mismatch against the behavior row. |
| Phase 3 | Another test breaks | **Retry**: revert and make a narrower change; never delete, skip or loosen the other test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
