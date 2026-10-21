# PR Correctness Pass

**One-line description:** Walks every changed function in reading-plan order through a fixed checklist of boundary values, error paths, resource cleanup, state transitions, equality and numeric traps, traces each changed function's callers, and proves each suspected bug with a minimal scratch test in a separate worktree before reporting it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone path.
- `diff_file` (string, required): Saved PR diff.
- `reading_plan` (object[], required): Ordered files from `prr-diff-reading-order`.
- `intent_statement` (object, required): Intent sentence and acceptance criteria.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `correctness_findings` (object[]): Findings written to `<findings_dir>/prr-correctness-pass.json`, each with evidence (a failing scratch test output or a quoted trace) or labeled `question`.

---

## Phase 1: List Changed Functions and Their Callers

### Entry Criteria
- `reading_plan` contains at least one file with `how` = full.

### Actions
1. For each `full` file in plan order, list every function or method whose body has an added or removed line. The `@@` hunk header usually names the enclosing function. To see each whole changed function, run `git diff -W origin/<base>...<head> -- <file>` (`-W` is `--function-context`).
2. For each changed function, find callers with ripgrep, matching the call syntax, not just the name:
   `rg -n --type <py|ts|js|go|java> '\b<name>\(' <repo_dir>`
   For methods also search `\.<name>\(`.
3. For each caller, note whether the PR changed it too. A function whose signature, return type, raised errors or side effects changed while a caller was not updated is the most common correctness defect in reviews.
4. Do not trust names: open the definition of every helper the changed code calls that you have not read in this review. Never assume what a function does from its name.

### Output
Table: function, file, callers, caller-updated yes or no.

### Quality Gate
- Every changed function has a caller count (0 is valid and noted as "unused or entry point").
- Every caller with caller-updated = no is listed for Phase 2.

---

## Phase 2: Apply the Correctness Checklist

### Entry Criteria
- Phase 1 table exists.

### Actions
1. For each changed function, answer every row. Write "n/a" only with a reason.

| Check | What to look for | Typical defect |
|---|---|---|
| Empty and missing input | `[]`, `""`, `{}`, `None`/`null`/`undefined`/`nil`, zero rows from a query | Index error, `.first()` on empty, nil pointer dereference |
| Boundaries | First and last element, `<` vs `<=`, slice end exclusive, pagination last page | Off-by-one, last item dropped |
| Numeric | Integer overflow, division by zero, float for money (`0.1 + 0.2`), rounding mode, negative values | Wrong totals, crash |
| Time | Naive vs aware datetimes (Python `datetime.now()` without `tz`), DST, time zones, `time.Now()` in tests | Off by hours, flaky behavior |
| Error paths | Swallowed errors (`except Exception: pass`, `catch (e) {}`, Go `_ = f()` or `if err != nil { return nil }`), wrong error wrapped | Silent data loss |
| Resource cleanup | Files, connections, locks closed on every path: Python `with`, Go `defer`, Java try-with-resources, JS `finally` | Leaks under error |
| State | Every new status or enum value handled in every `switch`/`match`/`if` chain; transitions allowed only from valid states | Unhandled case falls through |
| Equality and identity | Python `is` vs `==`, JS `==` vs `===`, Java `==` on `String`/`Integer`, comparing floats with `==` | Wrong branch taken |
| Mutation and aliasing | Python mutable default args (`def f(x=[])`), returning internal lists, mutating input arguments, Go slices sharing backing arrays after `append` | Data changes in unrelated code |
| Return on all branches | Missing return in one branch (JS returns `undefined`, Python returns `None`) | Caller receives None |
| Idempotency | Retried handler, job or webhook runs twice | Double charge, duplicate row |
| Acceptance criteria | Each criterion in `intent_statement` holds on the code as written | Feature incomplete |

2. For each "suspect" answer, write the concrete input that triggers it, for example "`apply_discount(total=Decimal('0'), pct=10)` divides by total".

### Output
Suspect list with triggering inputs.

### Quality Gate
- Every changed function has all twelve rows answered.
- Every suspect has a concrete triggering input, not a general concern.

---

## Phase 3: Prove or Downgrade Each Suspect

### Entry Criteria
- At least one suspect exists; otherwise write an empty findings file and finish.

### Actions
1. Create a throwaway worktree so the PR checkout is never modified: `git -C <repo_dir> worktree add ../prr-scratch <head_sha>`.
2. Write one minimal scratch test per suspect using the project's existing test framework and the triggering input from Phase 2. Run only that test: `pytest -q path::test_name`, `npx vitest run path -t "name"` or `npx jest path -t "name"`, `go test -run '^TestName$' ./pkg/`.
3. Decision rule:

| Scratch test result | Finding label |
|---|---|
| Fails and shows wrong output or crash | blocking; paste the failure output as evidence and the test as the suggested regression test |
| Passes | drop the suspect |
| Cannot be run (needs infrastructure) | question; quote the code path and the input |

4. Remove the worktree after copying the test text: `git worktree remove --force ../prr-scratch`. Never push scratch tests to the author's branch.
5. Write `<findings_dir>/prr-correctness-pass.json` (fields `flow`, `category`="correctness", `file`, `line`, `evidence`, `proposed_label`, `fix`) and validate with `python -m json.tool`.

### Output
`correctness_findings`.

### Quality Gate
- Every `blocking` finding has a failing test output in `evidence`.
- `git worktree list` no longer shows `prr-scratch`.

---

## Worked Example

Illustrative. Diff changes `def split_into_pages(items, size): return [items[i:i+size] for i in range(0, len(items)-size, size)]`.

- Phase 1: callers: `api/export.py:88`, not changed.
- Phase 2: Boundaries row is suspect: `range(0, len(items)-size, size)` stops before the last page. Triggering input: `split_into_pages([1,2,3], 2)`.
- Phase 3: scratch test `assert split_into_pages([1,2,3], 2) == [[1,2],[3]]`; `pytest -q` prints `AssertionError: assert [[1, 2]] == [[1, 2], [3]]`. Finding: blocking, `export/paging.py:14`, fix `range(0, len(items), size)`, with the test text as the suggested regression test.

---

## Exit Criteria

DONE when every changed function has the checklist answered, every suspect is proven with a scratch test, dropped, or asked as a question, and the findings file is valid JSON with evidence on every blocking item.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Dynamic dispatch hides callers (reflection, string-based routing) | **Adjust**: search for the name as a string literal too: `rg -n "'<name>'\|\"<name>\""`. |
| Phase 2 | Too many functions for one sitting | **Return**: send back to `prr-large-pr-split` for smaller units. |
| Phase 3 | Test suite cannot run locally | **Adjust**: downgrade suspects to `question` with the triggering input; never report them as proven. |
| Phase 3 | Scratch test fails for an unrelated setup reason | **Retry**: fix the test setup; do not report the setup error as a PR defect. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
