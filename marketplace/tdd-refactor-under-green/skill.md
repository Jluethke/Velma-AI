# TDD Refactor Under Green

**One-line description:** Improves the structure of code and tests after green using named refactorings from Fowler's catalog, one move at a time, running the full suite and committing after each move, and reverting instead of debugging when a move turns the suite red.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `generalized_change` (object, required): Production diff and suite evidence from `tdd-triangulate`.
- `test_runner` (string, required): One of `pytest`, `unittest`, `jest`, `vitest`, `go-test`, `cargo-test`, `junit5`.

---

## Outputs

- `refactored_code` (object): Files touched, final diff since green, and the final full-suite result.
- `refactor_log` (object[]): One row per move: refactoring name, file, before/after snippet, suite result, commit hash. Also `behaviors_remaining` (count of "todo" rows).

---

## Phase 1: Snapshot Green and List Smells

### Entry Criteria
- Full suite green.

### Actions
1. Run the full suite. Record the passed count. This count must not change during this flow.
2. Commit the green state: `git add -A && git commit -m "green: <behavior id>"`. If the project is not a git repository, copy the touched files to a backup folder outside the source tree and record its path.
3. List smells in the code touched by this cycle, using this table:

| Smell | Refactoring (Fowler, 2nd ed.) |
|---|---|
| Same logic written for the third time (Fowler's "Rule of Three", credited to Don Roberts) | Extract Function |
| Name does not say what it holds or does | Rename Variable / Change Function Declaration |
| Unexplained literal (`0.2`, `86400`) | Replace Magic Literal (named constant) |
| Long expression | Extract Variable |
| Variable used once, adds nothing | Inline Variable |
| Many parameters always passed together | Introduce Parameter Object |
| The same `switch` / `if-elif` on a type code appears in more than one place (Fowler's "Repeated Switches" smell) | Replace Conditional with Polymorphism |
| Code no test reaches and no caller uses | Remove Dead Code |
| Duplicate arrange blocks in tests | Extract a fixture or helper (pytest fixture, `beforeEach`, Go helper with `t.Helper()`, JUnit `@BeforeEach`) |

4. If no smell is found, skip to Phase 3. Refactoring is optional when the code is already clear.

### Output
Green commit and a smell list.

### Quality Gate
- `git log -1 --oneline` shows the green commit (or the backup path is recorded).
- Each smell names a file, line and one refactoring from the table.

---

## Phase 2: One Move, Run, Commit

### Entry Criteria
- Smell list exists.

### Actions
1. Take the first smell. Apply ONLY its refactoring. Prefer the IDE or language tool's automated refactoring (rename symbol, extract function) over hand edits (for Go, `gopls rename -w <file>:<line>:<col> <newName>`; check `gopls rename -h` first).
2. Run the full suite.
3. If green: commit (`git commit -am "refactor: <name> in <file>"`), add a `refactor_log` row, go to the next smell.
4. If red: run `git restore .` (or `git checkout -- .`) to return to the last commit. Do not debug. Retry the same smell in a smaller step, or skip it.
5. Rules:
   - Never change behavior: no new features, no bug fixes, no changed error messages. A behavior change needs a new red test first.
   - Never edit an assertion or expected value. Test refactors may move arrange code into fixtures but may not change what is asserted.
   - Never refactor production and tests in the same move.
   - Never rename a public API that callers outside this change use, unless the requirement asks for it.

### Output
A sequence of green commits, one per move.

### Quality Gate
- Every `refactor_log` row has a suite result of exit 0 and a commit hash.
- `git diff <green commit> -- <test files>` shows no changed lines that start with `assert`, `expect(`, `assertEquals`, `t.Errorf`, `assert_eq!` (search the diff).

---

## Phase 3: Final Check and Next Behavior

### Entry Criteria
- All smells handled or skipped.

### Actions
1. Run the full suite once more with the cache disabled (`go test -count=1 ./...`, `./gradlew test --rerun`, others as usual).
2. Compare the passed count to Phase 1. They must be equal.
3. Run the linter or formatter the project already uses (for example `ruff check .`, `npx eslint .`, `go vet ./...`, `cargo clippy`, `mvn -q verify` if it runs checks) and fix only issues in touched lines.
4. Mark the behavior row "done". Set `behaviors_remaining` to the count of "todo" rows. If it is above zero, the next cycle starts at `tdd-red-one-failing-test`.

### Output
`refactored_code`, `refactor_log`.

### Quality Gate
- Passed count after equals passed count before.
- The linter command exits 0 for the touched files, or the remaining warnings existed before this cycle (check with `git stash` comparison).

---

## Worked Example

Illustrative only. `test_runner` = `vitest`. After green, `price.ts` has `return qty * 19.99 * (1 - 0.2)` and tests repeat the same cart setup three times.

Phase 1: `npx vitest run` gives `Tests  6 passed (6)`; commit `green: B06`. Smells: magic literals `19.99` and `0.2`; duplicated arrange in tests.
Phase 2:
- Move 1, Replace Magic Literal: `const UNIT_PRICE = 19.99; const MEMBER_DISCOUNT = 0.2;` run: `6 passed`, commit `a1b2c3d`.
- Move 2, test fixture: arrange moved into `beforeEach(() => { cart = makeCart(); })`; run: `6 passed`, commit `d4e5f6a`.
Phase 3: `npx vitest run` gives `6 passed`; `npx eslint src` exits 0; `behaviors_remaining` = 3.

---

## Exit Criteria

DONE when each refactoring was a single named move followed by a green run and a commit, the passed count is unchanged, no assertion changed, and `behaviors_remaining` is reported.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Suite not green | **Stop**: refactoring on red is not allowed; return to `tdd-green-minimal-code`. |
| Phase 2 | Move turns suite red | **Retry**: `git restore .`, then apply the move in a smaller step or skip it. |
| Phase 2 | Refactor seems to need a behavior change | **Return**: write a new behavior row and start at red. |
| Phase 3 | Passed count dropped | **Stop**: a test was deleted or stopped being collected; restore it from the green commit. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
