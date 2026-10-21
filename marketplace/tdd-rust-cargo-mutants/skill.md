# TDD Rust Mutation Testing With cargo-mutants

**One-line description:** Runs cargo-mutants on the changed Rust files, reads the caught, missed, unviable and timeout lists in mutants.out, and kills each missed mutant with one red-first test or records it as equivalent.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `refactored_code` (object, required): Changed production files and suite result from `tdd-refactor-under-green`.
- `coverage_report` (object, required): From `tdd-rust-coverage`; used to pick files to mutate.

---

## Outputs

- `mutation_report` (object): cargo-mutants version, files mutated, counts of caught, missed, unviable and timeout, and the `mutants.out` path.
- `killing_tests` (object[]): Mutant description, new test, red evidence with the mutant applied, green evidence after restore.
- `equivalent_mutants` (object[]): Mutant description and reason.

---

## Phase 1: Install and Run

### Entry Criteria
- `cargo test` passes; `git status --porcelain` is empty.

### Actions
1. Install: `cargo install --locked cargo-mutants`. Confirm with `cargo mutants --version`.
2. Preview without running: `cargo mutants --list -f src/parse.rs` lists the mutants for that file.
3. Run on files changed this cycle: `cargo mutants -f src/parse.rs` (repeat `-f` per file). Other useful options (confirm in `cargo mutants --help`): `--in-diff <file.diff>` mutates only lines in a diff, `-j <n>` runs jobs in parallel, `--test-tool=nextest` uses cargo-nextest.
4. cargo-mutants copies the tree to a temp dir, so your source is not modified. It first runs a baseline build and test; the baseline must pass.
5. Add `mutants.out/` and `mutants.out.old/` to `.gitignore`.

### Output
`mutants.out/` with results.

### Quality Gate
- Output ends with a summary like `N mutants tested: A missed, B caught, C unviable`.
- `mutants.out/outcomes.json` exists.

---

## Phase 2: Read mutants.out

### Entry Criteria
- `mutants.out/` exists.

### Actions
1. Files and meanings:

| File | Meaning | Action |
|---|---|---|
| `caught.txt` | a test failed: good | none |
| `missed.txt` | all tests passed with this mutant | Phase 3 |
| `timeout.txt` | mutant hung; counted as detected | none |
| `unviable.txt` | mutant did not compile | ignore |
| `diff/` | one diff file per mutant | read to see the change |

2. Each missed line reads like `src/parse.rs:31:5: replace parse_port -> Result<u16, Error> with Ok(0)` or `src/parse.rs:40:14: replace < with <= in parse_port`. Typical mutation kinds: replace a function body with a default value (`Ok(0)`, `Default::default()`, `true`, `false`, `String::new()`, `()`), and replace binary operators (`==`/`!=`, `<`/`<=`, `&&`/`||`, `+`/`-`).
3. A missed "replace body with `()`" mutant means no test checks any side effect of that function.

### Output
Missed list with behavior sentences.

### Quality Gate
- Every line in `missed.txt` has a behavior sentence.

---

## Phase 3: Kill or Classify

### Entry Criteria
- Missed list exists.

### Actions
1. For each missed mutant with an observable difference:
   a. Write the test asserting the requirement's result. Run `cargo test <name>`: passes on the original.
   b. Apply the mutant's diff to the source: `git apply mutants.out/diff/<file>.diff` (check the diff file name in `diff/`). Run the new test: must fail.
   c. `git restore src/parse.rs`. Run `cargo test`: green.
2. Equivalent mutants: record the reason. To exclude permanently, use `#[mutants::skip]` (needs the `mutants` crate) or `exclude_re` in `.cargo/mutants.toml`, only if the project allows it.
3. Rerun `cargo mutants -f src/parse.rs` and confirm `missed.txt` no longer lists the killed mutants.
4. Do not delete code or loosen asserts to remove a missed mutant unless coverage classified the code as dead.

### Output
`mutation_report`, `killing_tests`, `equivalent_mutants`.

### Quality Gate
- After the rerun, every former missed mutant is caught or in `equivalent_mutants`.
- Each killing test has red output from step 1b.
- `git status --porcelain` shows only intended test changes.

---

## Worked Example

Illustrative only. Crate `netcfg`.

```
$ cargo mutants -f src/parse.rs
Found 12 mutants to test
MISSED   src/parse.rs:40:14: replace < with <= in parse_port in 0.4s build + 0.3s test
12 mutants tested in 9s: 1 missed, 10 caught, 1 unviable
```

Line 40 is `if n < 1024 { return Err(Error::Privileged) }`. Requirement: ports below 1024 are privileged, 1024 is allowed. Test `assert_eq!(parse_port("1024"), Ok(1024));` passes on original; with `<=` applied it fails (`left: Err(Privileged)`, `right: Ok(1024)`); restore; rerun shows the mutant caught.

---

## Exit Criteria

DONE when cargo-mutants ran on the changed files, every missed mutant is killed by a test proven red against it or recorded as equivalent, and the source has no applied mutant.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `baseline test failed` | **Stop**: fix the normal `cargo test` run first. |
| Phase 1 | Run too slow | **Adjust**: limit with `-f` per changed file or `--in-diff`. |
| Phase 3 | `git apply` rejects the diff | **Adjust**: apply the single changed line by hand from the diff. |
| Phase 3 | Killing test fails on original | **Stop**: test or code is wrong; return to red. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
