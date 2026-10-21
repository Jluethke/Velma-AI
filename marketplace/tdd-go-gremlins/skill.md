# TDD Go Mutation Testing With Gremlins

**One-line description:** Runs the Gremlins mutation tester on a Go module after coverage, reads the KILLED, LIVED and NOT COVERED results with their mutator types and positions, and kills each LIVED mutant with one red-first test or records it as equivalent.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `refactored_code` (object, required): Changed production files and suite result from `tdd-refactor-under-green`.
- `coverage_report` (object, required): From `tdd-go-coverage`; used to pick packages to mutate.

---

## Outputs

- `mutation_report` (object): Gremlins version, packages mutated, counts per status (KILLED, LIVED, NOT COVERED, TIMED OUT, NOT VIABLE), test efficacy and mutator coverage percentages, and commands.
- `killing_tests` (object[]): Mutant position and type, new test or table case, red evidence with the mutant hand-applied, green evidence after restore.
- `equivalent_mutants` (object[]): Mutant position, change and reason.

---

## Phase 1: Install and Run

### Entry Criteria
- `go test -count=1 ./...` passes; `git status --porcelain` is empty.

### Actions
1. Install: `go install github.com/go-gremlins/gremlins/cmd/gremlins@latest`. Confirm with `gremlins --help`. Gremlins targets small and medium Go modules; on a large module, run it per package.
2. From the module root, run on the package changed in this cycle: `gremlins unleash ./cart`. (Run `gremlins unleash --help` to see the flags of the installed version, such as dry-run, tags, integration mode, thresholds and output file; do not pass a flag the help does not list.)
3. Gremlins first runs `go test` with coverage to find covered code, then mutates covered positions and reruns the tests for each mutant.

### Output
A result line per mutant and a summary.

### Quality Gate
- The run prints a summary with `Killed`, `Lived`, `Not covered` counts and the efficacy and mutator coverage percentages.

---

## Phase 2: Read the Results

### Entry Criteria
- Summary printed.

### Actions
1. Status meanings:

| Status | Meaning | Action |
|---|---|---|
| KILLED | a test failed with the mutant | none |
| LIVED | tests passed with the mutant | Phase 3 |
| NOT COVERED | no test covers this position | missing behavior or dead code per `tdd-go-coverage` |
| TIMED OUT | mutant made tests hang | counts as detected |
| NOT VIABLE | mutant does not compile | ignore |

2. Each line shows the mutator type and position, for example `LIVED CONDITIONALS_BOUNDARY at cart/cart.go:22:10`. Mutator types include `CONDITIONALS_BOUNDARY` (`<` to `<=`), `CONDITIONALS_NEGATION` (`==` to `!=`), `ARITHMETIC_BASE` (`+` to `-`), `INCREMENT_DECREMENT` (`++` to `--`), and `INVERT_NEGATIVES`. Some types are off by default; see the Gremlins docs for the list.
3. Open the file at the position and write the mutated line by hand in your notes, plus one sentence on what behavior it changes.

### Output
LIVED list with behavior sentences.

### Quality Gate
- Every LIVED mutant has position, mutator type, the mutated line and a behavior sentence.

---

## Phase 3: Kill or Classify

### Entry Criteria
- LIVED list exists.

### Actions
1. For each LIVED mutant with an observable difference:
   a. Add a case to the existing table test (preferred) or a new `TestXxx`. Run `go test -count=1 -run '^TestName$' ./cart`: passes on the original.
   b. Hand-apply the mutation at the reported position (for example change `<` to `<=` at `cart.go:22:10`). Rerun: must fail with `got ..., want ...`.
   c. `git restore cart/cart.go`. Run `go test -count=1 ./...`: green.
2. Equivalent mutants (no input can tell them apart, for example a boundary change on a loop whose bound is never reached exactly): record the reason.
3. Rerun `gremlins unleash ./cart`. Former LIVED mutants must now be KILLED or recorded as equivalent.
4. Never delete the mutated code or weaken a check to make a mutant go away, unless coverage classified it as dead code.

### Output
`mutation_report`, `killing_tests`, `equivalent_mutants`.

### Quality Gate
- Every former LIVED mutant is KILLED in the rerun or listed in `equivalent_mutants`.
- Each killing test has red output from step 1b.
- `git status --porcelain` shows only the intended test changes.

---

## Worked Example

Illustrative only. Package `./cart`.

```
$ gremlins unleash ./cart
      KILLED CONDITIONALS_NEGATION at cart/cart.go:14:9
       LIVED CONDITIONALS_BOUNDARY at cart/cart.go:22:10
Killed: 7, Lived: 1, Not covered: 0
Timed out: 0, Not viable: 0
Test efficacy: 87.50%
Mutator coverage: 100.00%
```

`cart.go:22` is `if qty > MaxQty { return ErrTooMany }`. Mutant: `>=`. The requirement says MaxQty is the largest allowed quantity, so `qty == MaxQty` must be accepted, and the existing table had no `at_max` case. Add `{name: "at_max", qty: MaxQty, wantErr: nil}`; it passes on the original; with `>=` hand-applied it fails with `got ErrTooMany, want <nil>`; restore; rerun shows KILLED.

---

## Exit Criteria

DONE when Gremlins ran on the changed packages, every LIVED mutant is killed by a test proven red against it or recorded as equivalent, and no hand-applied mutation remains.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `gremlins: command not found` | **Adjust**: add `$(go env GOPATH)/bin` to `PATH`. |
| Phase 1 | Run takes too long on the whole module | **Adjust**: run per changed package. |
| Phase 1 | Gremlins cannot be installed | **Return**: record mutation testing as not run for Go, with the reason; do not claim a score. |
| Phase 3 | Killing test fails on the original | **Stop**: test or code is wrong; return to red. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
